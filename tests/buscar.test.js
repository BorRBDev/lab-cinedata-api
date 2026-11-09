const request = require("supertest");
const express = require("express");

jest.mock("../src/models/Pelicula.js", () => ({ find: jest.fn(), findById: jest.fn() }));
const Pelicula = require("../src/models/Pelicula.js");
const router = require("../src/routes/pelicula.routes.js");

const app = express();
app.use(express.json());
app.use("/peliculas", router);

let cadena;
beforeEach(() => {
  cadena = { sort: jest.fn().mockReturnThis(), limit: jest.fn() };
  Pelicula.find.mockReset().mockReturnValue(cadena);
  Pelicula.findById.mockReset();
});

const peli = (titulo) => ({ resumen: () => ({ titulo }) });

describe("GET /peliculas/buscar", () => {
  test("q=ma devuelve 200 y array de resumenes", async () => {
    cadena.limit.mockResolvedValue([peli("Matrix"), peli("Mad Max")]);

    const res = await request(app).get("/peliculas/buscar?q=ma");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ titulo: "Matrix" }, { titulo: "Mad Max" }]);
  });

  test("sin resultados devuelve 200 y array vacio", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar?q=zz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("sin q devuelve 400 con {error, detalles}", async () => {
    const res = await request(app).get("/peliculas/buscar");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(Array.isArray(res.body.detalles)).toBe(true);
    expect(Pelicula.find).not.toHaveBeenCalled();
  });

  test("q de 1 caracter devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=a");

    expect(res.status).toBe(400);
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test("q de 1 caracter tras trim devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=%20c%20");

    expect(res.status).toBe(400);
    expect(Pelicula.find).not.toHaveBeenCalled();
  });

  test("q=czzzzz sin coincidencias devuelve 200 y array vacio", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar?q=czzzzz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("q se recorta antes de buscar", async () => {
    cadena.limit.mockResolvedValue([]);

    await request(app).get("/peliculas/buscar?q=%20ma%20");

    expect(Pelicula.find).toHaveBeenCalledWith({ titulo: { $regex: "ma", $options: "i" } });
  });

  test("q de 31 caracteres devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=" + "a".repeat(31));

    expect(res.status).toBe(400);
  });

  test("q de 30 caracteres devuelve 200", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar?q=" + "a".repeat(30));

    expect(res.status).toBe(200);
  });

  test("caracteres de regex no rompen y llegan escapados", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar").query({ q: "a.(" });

    expect(res.status).toBe(200);
    expect(Pelicula.find).toHaveBeenCalledWith({ titulo: { $regex: "a\\.\\(", $options: "i" } });
  });

  test("/buscar no cae en validarId", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar?q=ma");

    expect(res.status).toBe(200);
    expect(Pelicula.findById).not.toHaveBeenCalled();
  });

  test("el servicio aplica regex i, sort anio:-1 titulo:1 y limit 20", async () => {
    cadena.limit.mockResolvedValue([]);

    await request(app).get("/peliculas/buscar?q=ma");

    expect(Pelicula.find).toHaveBeenCalledWith({ titulo: { $regex: "ma", $options: "i" } });
    expect(cadena.sort).toHaveBeenCalledWith({ anio: -1, titulo: 1 });
    expect(cadena.limit).toHaveBeenCalledWith(20);
  });

  test("q=co devuelve 200 con un array (spec)", async () => {
    cadena.limit.mockResolvedValue([peli("Coco")]);

    const res = await request(app).get("/peliculas/buscar?q=co");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("es publico: funciona sin cabecera Authorization", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/buscar?q=co");

    expect(res.status).toBe(200);
  });

  test("q vacio devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=");

    expect(res.status).toBe(400);
    expect(Pelicula.find).not.toHaveBeenCalled();
  });

  test("q solo con espacios devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=%20%20%20");

    expect(res.status).toBe(400);
    expect(Pelicula.find).not.toHaveBeenCalled();
  });

  test("q repetido (array) devuelve 400", async () => {
    const res = await request(app).get("/peliculas/buscar?q=ab&q=cd");

    expect(res.status).toBe(400);
    expect(Pelicula.find).not.toHaveBeenCalled();
  });
});
