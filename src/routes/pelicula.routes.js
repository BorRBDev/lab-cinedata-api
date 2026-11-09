const express = require("express");
const { listar, top, recientes, buscar, obtener, resenas, crear, actualizar, eliminar, crearResena } = require("../controller/pelicula.controller.js");
const { validarListar } = require("../validators/listar.validator.js");
const { validarCrear, validarActualizar } = require("../validators/pelicula.validator.js");
const { validarBuscar } = require("../validators/buscar.validator.js");
const validarId = require("../middlewares/validarId.js");
const autenticar = require("../middlewares/autenticar.js");
const autorizar = require("../middlewares/autorizar.js");

const router = express.Router(); 

/**
 * @openapi
 * /peliculas:
 *   get:
 *     tags: [Películas]
 *     summary: Lista las películas con filtros, orden y paginación
 *     parameters:
 *       - name: genero
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: Drama
 *       - name: anioDesde
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2000
 *       - name: notaMin
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           example: 7.5
 *       - name: disponible
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: orden
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [nota, anio, titulo]
 *           default: nota
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Máximo 50 (valores mayores se recortan a 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *     responses:
 *       200:
 *         description: Página de películas en resumen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PeliculasResumen'
 *                 paginacion:
 *                   type: object
 *                   properties:
 *                     pagina: { type: integer }
 *                     limite: { type: integer }
 *                     total: { type: integer }
 *                     paginas: { type: integer }
 *       400:
 *         description: Algún parámetro de consulta no es válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 */
router.get("/", validarListar, listar);

router.get("/top", top);

/**
 * @openapi
 * /peliculas/recientes:
 *   get:
 *     tags: [Películas]
 *     summary: Las 10 últimas películas añadidas
 *     description: Ordenadas de la más reciente a la más antigua según su fecha de alta.
 *     responses:
 *       200:
 *         description: Hasta 10 películas en resumen (puede ser un array vacío)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               maxItems: 10
 *               items:
 *                 $ref: '#/components/schemas/PeliculasResumen'
 */
router.get("/recientes", recientes);

/**
 * @openapi
 * /peliculas/buscar:
 *   get:
 *     tags: [Películas]
 *     summary: Busca películas por título
 *     description: Coincidencia parcial sin distinguir mayúsculas, ordenadas por año descendente, máximo 20.
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Texto a buscar en el título (se recorta con trim)
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 30
 *           example: co
 *     responses:
 *       200:
 *         description: Películas encontradas en resumen (puede ser un array vacío)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PeliculasResumen'
 *       400:
 *         description: q falta o no tiene entre 2 y 30 caracteres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 */
router.get("/buscar", validarBuscar, buscar);
router.post("/:id/resenas",autenticar,  validarId, crearResena);
router.get("/:id", validarId, obtener);
router.get("/:id/resenas", validarId, resenas);
// DESPUÉS PROBAREMOS SIN SPREED
/**
 * @openapi
 * /peliculas:
 *   post:
 *     tags: [Películas]
 *     summary: Crea una película (solo admin)
 *     description: Solo se aceptan los campos de la lista blanca; el resto se ignora.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, anio, director]
 *             properties:
 *               titulo: { type: string, example: Coco }
 *               anio: { type: integer, minimum: 1900, maximum: 2100, example: 2017 }
 *               generos: { type: array, items: { type: string }, example: [Animación] }
 *               nota: { type: number, minimum: 0, maximum: 10, example: 8.6 }
 *               duracion: { type: integer, minimum: 1, description: Minutos, example: 105 }
 *               director:
 *                 type: object
 *                 required: [nombre]
 *                 properties:
 *                   nombre: { type: string, example: Lee Unkrich }
 *                   pais: { type: string, example: EE.UU. }
 *               disponible: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Película creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pelicula'
 *       400:
 *         description: Datos no válidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 *       401:
 *         description: Sin token o token no válido
 *       403:
 *         description: Solo admin
 */
router.post("/", autenticar, autorizar("admin"), validarCrear, crear);
/**
 * @openapi
 * /peliculas/{id}:
 *   put:
 *     tags: [Películas]
 *     summary: Actualiza una película (solo admin)
 *     description: Todos los campos son opcionales; solo se aplican los de la lista blanca.
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo: { type: string }
 *               anio: { type: integer, minimum: 1900, maximum: 2100 }
 *               generos: { type: array, items: { type: string } }
 *               nota: { type: number, minimum: 0, maximum: 10 }
 *               duracion: { type: integer, minimum: 1, description: Minutos }
 *               director:
 *                 type: object
 *                 properties:
 *                   nombre: { type: string }
 *                   pais: { type: string }
 *               disponible: { type: boolean }
 *     responses:
 *       200:
 *         description: Película actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pelicula'
 *       400:
 *         description: Datos no válidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 *       401:
 *         description: Sin token o token no válido
 *       403:
 *         description: Solo admin
 *       404:
 *         description: Película no encontrada
 */
router.put("/:id", autenticar, autorizar("admin"), validarId, validarActualizar, actualizar);
router.delete("/:id", autenticar, autorizar("admin"),validarId, eliminar);

module.exports = router;
