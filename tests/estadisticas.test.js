process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5500";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app.js");
const Pelicula = require("../src/models/Pelicula.js");

let mongod;

const dir = { nombre: "Dir", pais: "ES" };
const peli = (titulo, generos, nota) => ({ titulo, anio: 2000, generos, nota, director: dir });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // runtimeAdapters: el driver 7.x hace import("os") dinamico, que falla dentro de la sandbox de Jest
  // (sin --experimental-vm-modules) y deja el handshake sin metadatos. Se le pasa "os" explicitamente.
  await mongoose.connect(mongod.getUri(), { dbName: "cinedata_test", runtimeAdapters: { os: require("os") } });
  await Pelicula.insertMany([
    peli("D1", ["Drama"], 9),
    peli("D2", ["Drama", "Crimen"], 8),
    peli("D3", ["Drama"], 8),          // Drama: 3 pelis, media 8.333 -> 8.3
    peli("C1", ["Comedia"], 7),
    peli("C2", ["Comedia", "Crimen"], 7),   // Comedia 7.0 (2), Crimen 7.5 (2)
    peli("T1", ["Terror"], 6),         // Terror: 1 peli
    peli("S1", ["SinNota"]),           // sin nota -> null
  ]);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("GET /peliculas/estadisticas", () => {
  test("200 con array ordenado por notaMedia desc y genero asc", async () => {
    // Arrange: datos sembrados en beforeAll
    // Act
    const res = await request(app).get("/peliculas/estadisticas");
    // Assert
    expect(res.status).toBe(200);
    // Drama 8.3, Crimen 7.5, Comedia 7, Terror 6, SinNota null (los null van al final en desc)
    expect(res.body.map(e => e.genero)).toEqual(["Drama", "Crimen", "Comedia", "Terror", "SinNota"]);
    const notas = res.body.map(e => e.notaMedia).filter(n => n !== null);
    expect(notas).toEqual([...notas].sort((a, b) => b - a));
  });

  test("redondea notaMedia a 1 decimal", async () => {
    const res = await request(app).get("/peliculas/estadisticas");
    const drama = res.body.find(e => e.genero === "Drama");
    expect(drama).toEqual({ genero: "Drama", total: 3, notaMedia: 8.3 });
  });

  test("minimo excluye generos con menos peliculas", async () => {
    const res = await request(app).get("/peliculas/estadisticas?minimo=2");
    expect(res.status).toBe(200);
    expect(res.body.map(e => e.genero).sort()).toEqual(["Comedia", "Crimen", "Drama"]);
    expect(res.body.every(e => e.total >= 2)).toBe(true);
  });

  test("notaMedia es null para generos sin notas", async () => {
    const res = await request(app).get("/peliculas/estadisticas");
    const g = res.body.find(e => e.genero === "SinNota");
    expect(g).toEqual({ genero: "SinNota", total: 1, notaMedia: null });
  });

  test("sin minimo devuelve 200 e incluye generos con una sola pelicula", async () => {
    const res = await request(app).get("/peliculas/estadisticas");
    expect(res.status).toBe(200);
    expect(res.body.some(e => e.genero === "Terror")).toBe(true);
  });

  test("/peliculas/estadisticas no la captura /:id", async () => {
    const res = await request(app).get("/peliculas/estadisticas");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test.each(["0", "51", "abc", "2.5"])("minimo=%s devuelve 400", async (valor) => {
    const res = await request(app).get(`/peliculas/estadisticas?minimo=${valor}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Los datos no son validos");
    expect(Array.isArray(res.body.detalles)).toBe(true);
    expect(res.body.detalles.length).toBeGreaterThan(0);
    res.body.detalles.forEach(d => expect(typeof d).toBe("string"));
  });

  test.each(["minimo=1&minimo=2"])("%s (array) devuelve 400", async (qs) => {
    const res = await request(app).get(`/peliculas/estadisticas?${qs}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Los datos no son validos");
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test("minimo[]=1&minimo[]=2 no llega como array (Express 5 usa el parser simple): se ignora y aplica el defecto", async () => {
    const res = await request(app).get("/peliculas/estadisticas?minimo[]=1&minimo[]=2");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });
});
