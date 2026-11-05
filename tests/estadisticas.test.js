process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5500";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../src/app.js");
const Pelicula = require("../src/models/Pelicula.js");

jest.setTimeout(120000);
let mongod;
let idDrama;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
    await mongoose.connect(mongod.getUri(), { runtimeAdapters: { os: require("os") } });
    const base = { anio: 2000, director: { nombre: "X" } };
    const docs = await Pelicula.create([
        { ...base, titulo: "A", generos: ["Drama", "Crimen"], nota: 9 },
        { ...base, titulo: "B", generos: ["Drama"], nota: 7 },
        { ...base, titulo: "C", generos: ["Comedia"], nota: 5 }
    ]);
    idDrama = docs[0].id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

describe("GET /peliculas/estadisticas", () => {
    test("200 devuelve estadisticas por genero ordenadas por notaMedia desc", async () => {
        // Arrange
        const ruta = "/peliculas/estadisticas";
        // Act
        const res = await request(app).get(ruta);
        // Assert
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { genero: "Crimen", total: 1, notaMedia: 9 },
            { genero: "Drama", total: 2, notaMedia: 8 },
            { genero: "Comedia", total: 1, notaMedia: 5 }
        ]);
    });

    test("?minimo=2 filtra generos con total menor que 2", async () => {
        // Arrange
        const ruta = "/peliculas/estadisticas?minimo=2";
        // Act
        const res = await request(app).get(ruta);
        // Assert
        expect(res.status).toBe(200);
        expect(res.body.map(g => g.genero)).toEqual(["Drama"]);
    });

    test.each(["0", "6", "abc"])("?minimo=%s devuelve 400 con campo error", async (valor) => {
        // Arrange
        const ruta = `/peliculas/estadisticas?minimo=${valor}`;
        // Act
        const res = await request(app).get(ruta);
        // Assert
        expect(res.status).toBe(400);
        expect(typeof res.body.error).toBe("string");
        expect(res.body.errores[0].campo).toBe("minimo");
    });

    test("/:id sigue funcionando y estadisticas no es capturada como id", async () => {
        // Arrange
        const ruta = `/peliculas/${idDrama}`;
        // Act
        const res = await request(app).get(ruta);
        const estad = await request(app).get("/peliculas/estadisticas");
        // Assert
        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe("A");
        expect(Array.isArray(estad.body)).toBe(true);
    });
});
