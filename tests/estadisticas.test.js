process.env.CORS_ORIGIN = "http://localhost";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app.js");
const Pelicula = require("../src/models/Pelicula.js");

jest.setTimeout(60000);

// Jest no soporta import() dinamico sin flags: el driver necesita el modulo os inyectado.
let mongod;

const peli = (titulo, nota, generos) => ({ titulo, anio: 2000, nota, generos, director: { nombre: "X" } });

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: "test", runtimeAdapters: { os: require("os") } });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await Pelicula.deleteMany({});
    await Pelicula.create([
        peli("A", 9, ["Drama"]),
        peli("B", 8, ["Drama", "Accion"]),
        peli("C", 8, ["Drama"]),
        peli("D", 6, ["Accion"]),
        peli("E", 9.5, ["Terror"])
    ]);
});

describe("GET /peliculas/estadisticas", () => {
    test("200 sin query devuelve genero, total y notaMedia con 2 decimales", async () => {
        // Arrange: datos del beforeEach
        // Act
        const res = await request(app).get("/peliculas/estadisticas");
        // Assert
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        expect(res.body).toContainEqual({ genero: "Drama", total: 3, notaMedia: 8.33 });
        expect(res.body).toContainEqual({ genero: "Accion", total: 2, notaMedia: 7 });
        expect(res.body).toContainEqual({ genero: "Terror", total: 1, notaMedia: 9.5 });
    });

    test("ordena por notaMedia descendente", async () => {
        const res = await request(app).get("/peliculas/estadisticas");
        const medias = res.body.map(g => g.notaMedia);
        expect(medias).toEqual([...medias].sort((a, b) => b - a));
        expect(res.body.map(g => g.genero)).toEqual(["Terror", "Drama", "Accion"]);
    });

    test("?minimo=2 solo incluye generos con total >= 2", async () => {
        const res = await request(app).get("/peliculas/estadisticas?minimo=2");
        expect(res.status).toBe(200);
        expect(res.body.map(g => g.genero)).toEqual(["Drama", "Accion"]);
        expect(res.body.every(g => g.total >= 2)).toBe(true);
    });

    test.each(["0", "6", "abc"])("?minimo=%s devuelve 400 con errores", async (valor) => {
        const res = await request(app).get(`/peliculas/estadisticas?minimo=${valor}`);
        expect(res.status).toBe(400);
        expect(Array.isArray(res.body.errores)).toBe(true);
        expect(res.body.errores.length).toBeGreaterThan(0);
    });
});

describe("GET /peliculas/:id (regresion)", () => {
    test("200 con un id existente", async () => {
        const p = await Pelicula.findOne({ titulo: "A" });
        const res = await request(app).get(`/peliculas/${p.id}`);
        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe("A");
    });

    test("400 con un id mal formado", async () => {
        const res = await request(app).get("/peliculas/no-es-un-id");
        expect(res.status).toBe(400);
    });
});
