const express = require("express");
const { listar, top, obtener, resenas, crear, actualizar, eliminar, crearResena } = require("../controller/pelicula.controller.js");
const validarId = require("../middlewares/validarId.js");
const autenticar = require("../middlewares/autenticar.js");
const autorizar = require("../middlewares/autorizar.js");

const router = express.Router(); 

/**
 * @openapi
 * /peliculas:
 *   get:
 *     tags: [Películas]
 *     summary: Lista las películas ordenadas por nota
 *     parameters:
 *       - name: genero
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: Drama
 *     responses:
 *       200:
 *         description: Lista de películas en resumen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PeliculasResumen'
 */
router.get("/", listar);

router.get("/top", top);
router.post("/:id/resenas",autenticar,  validarId, crearResena);
router.get("/:id", validarId, obtener);
router.get("/:id/resenas", validarId, resenas);
// DESPUÉS PROBAREMOS SIN SPREED
router.post("/", autenticar, autorizar("admin"), crear);
router.put("/:id", autenticar, autorizar("admin", "usuario"),validarId, actualizar);
router.delete("/:id", autenticar, autorizar("admin"),validarId, eliminar);

module.exports = router;
