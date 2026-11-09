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

describe("GET /peliculas/recientes", () => {
  test("devuelve 200 y array de resumenes", async () => {
    cadena.limit.mockResolvedValue([peli("Dune"), peli("Matrix")]);

    const res = await request(app).get("/peliculas/recientes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ titulo: "Dune" }, { titulo: "Matrix" }]);
  });

  test("sin peliculas devuelve 200 y array vacio", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/recientes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("ordena por _id descendente y limita a 10", async () => {
    cadena.limit.mockResolvedValue([]);

    await request(app).get("/peliculas/recientes");

    expect(Pelicula.find).toHaveBeenCalledWith();
    expect(cadena.sort).toHaveBeenCalledWith({ _id: -1 });
    expect(cadena.limit).toHaveBeenCalledWith(10);
  });

  test("/recientes no cae en validarId", async () => {
    cadena.limit.mockResolvedValue([]);

    const res = await request(app).get("/peliculas/recientes");

    expect(res.status).toBe(200);
    expect(Pelicula.findById).not.toHaveBeenCalled();
  });
});
