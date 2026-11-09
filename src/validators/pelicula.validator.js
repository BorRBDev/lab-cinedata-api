const { body } = require("express-validator");
const { validar } = require("./buscar.validator.js");

// Lista blanca de campos editables (según src/models/Pelicula.js):
// titulo, anio, generos, nota, duracion, director.nombre, director.pais, disponible.
// Cualquier otro campo del body (incluidos operadores como $set) lo descarta matchedData.
function camposPelicula({ obligatorios }) {
    const campo = (nombre) => {
        const regla = body(nombre);
        return obligatorios.includes(nombre)
            ? regla.exists({ values: "undefined" }).withMessage(`${nombre} es obligatorio`).bail()
            : regla.optional();
    };

    return [
        campo("titulo")
            .isString().withMessage("titulo debe ser texto").bail()
            .trim().notEmpty().withMessage("titulo no puede estar vacío"),
        campo("anio")
            .isInt({ min: 1900, max: 2100 }).withMessage("anio debe ser un entero entre 1900 y 2100")
            .bail().toInt(),
        body("generos").optional()
            .isArray().withMessage("generos debe ser una lista de textos"),
        body("generos.*")
            .isString().withMessage("cada género debe ser texto").bail()
            .trim().notEmpty().withMessage("un género no puede estar vacío"),
        campo("nota")
            .isFloat({ min: 0, max: 10 }).withMessage("nota debe ser un número entre 0 y 10")
            .bail().toFloat(),
        campo("duracion")
            .isInt({ min: 1 }).withMessage("duracion debe ser un entero de minutos mayor o igual que 1")
            .bail().toInt(),
        campo("director")
            .isObject().withMessage("director debe ser un objeto con nombre y pais"),
        campo("director.nombre")
            .isString().withMessage("director.nombre debe ser texto").bail()
            .trim().notEmpty().withMessage("director.nombre no puede estar vacío"),
        body("director.pais").optional()
            .isString().withMessage("director.pais debe ser texto").bail()
            .trim(),
        campo("disponible")
            .isBoolean().withMessage("disponible debe ser true o false")
            .bail().toBoolean(),
        validar
    ];
}

const validarCrear = camposPelicula({ obligatorios: ["titulo", "anio", "director.nombre"] });
const validarActualizar = camposPelicula({ obligatorios: [] });

module.exports = { validarCrear, validarActualizar };
