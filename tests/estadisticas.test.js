process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app.js");
const Pelicula = require("../src/models/Pelicula.js");

const ERROR_MINIMO = {
  error: "Datos no válidos",
  detalles: ["minimo debe ser un entero entre 1 y 5"],
};

const base = { anio: 2000, director: { nombre: "Dir" } };
let mongod;
let idExistente;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // runtimeAdapters: el driver hace import("os") dinámico, que Jest no soporta sin
  // --experimental-vm-modules; se le pasa el módulo os explícitamente.
  await mongoose.connect(mongod.getUri(), { dbName: "test", runtimeAdapters: { os: require("os") } });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Pelicula.deleteMany({});
  // Drama: 3 pelis (9, 8, 7.5 -> 8.17); Accion: 2 (8, 8.5 -> 8.25);
  // Comedia: 2 (6, 6 -> 6); Terror: 1 (8.25, empata en nota con Accion)
  const docs = await Pelicula.create([
    { ...base, titulo: "A", generos: ["Drama"], nota: 9 },
    { ...base, titulo: "B", generos: ["Drama", "Accion"], nota: 8 },
    { ...base, titulo: "C", generos: ["Drama"], nota: 7.5 },
    { ...base, titulo: "D", generos: ["Accion"], nota: 8.5 },
    { ...base, titulo: "E", generos: ["Comedia"], nota: 6 },
    { ...base, titulo: "F", generos: ["Comedia"], nota: 6 },
    { ...base, titulo: "G", generos: ["Terror"], nota: 8.25 },
  ]);
  idExistente = docs[0].id;
});

describe("GET /peliculas/estadisticas", () => {
  test("sin query devuelve todos los géneros ordenados, con media redondeada y total", async () => {
    // Arrange: datos sembrados en beforeEach
    // Act
    const res = await request(app).get("/peliculas/estadisticas");
    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { genero: "Accion", total: 2, notaMedia: 8.25 },
      { genero: "Terror", total: 1, notaMedia: 8.25 }, // empate: desempate por género asc
      { genero: "Drama", total: 3, notaMedia: 8.17 }, // (9+8+7.5)/3 = 8.1666 -> 8.17
      { genero: "Comedia", total: 2, notaMedia: 6 },
    ]);
  });

  test("?minimo=2 excluye géneros con menos de 2 películas", async () => {
    const res = await request(app).get("/peliculas/estadisticas?minimo=2");
    expect(res.status).toBe(200);
    expect(res.body.map(e => e.genero)).toEqual(["Accion", "Drama", "Comedia"]);
    expect(res.body.every(e => e.total >= 2)).toBe(true);
  });

  test.each(["1", "5"])("?minimo=%s es válido", async (m) => {
    const res = await request(app).get(`/peliculas/estadisticas?minimo=${m}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (m === "1") expect(res.body).toHaveLength(4);
    if (m === "5") expect(res.body).toEqual([]);
  });

  test.each(["0", "6", "abc", "2.5", ""])("?minimo=%p devuelve 400", async (m) => {
    const res = await request(app).get(`/peliculas/estadisticas?minimo=${m}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(ERROR_MINIMO);
  });
});

describe("rutas con :id", () => {
  test("/peliculas/:id sigue funcionando y no lo captura /estadisticas", async () => {
    const res = await request(app).get(`/peliculas/${idExistente}`);
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe("A");
  });

  test("id inválido devuelve 400", async () => {
    const res = await request(app).get("/peliculas/no-es-un-id");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "El id no tiene formato válido" });
  });
});
