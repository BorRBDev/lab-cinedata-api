const { query } = require("express-validator");
const { validar } = require("./buscar.validator.js");

const LIMITE_MAX = 50;
// Un valor vacío (?genero=) se trata como ausente, igual que hacía el controlador
const opcional = { values: "falsy" };

const validarListar = [
    query("genero").optional(opcional)
        .isString().withMessage("genero debe ser texto"),
    query("anioDesde").optional(opcional)
        .isInt().withMessage("anioDesde debe ser un entero")
        .bail().toInt(),
    query("notaMin").optional(opcional)
        .isFloat({ min: 0, max: 10 }).withMessage("notaMin debe ser un número entre 0 y 10")
        .bail().toFloat(),
    query("disponible").optional()
        .isBoolean().withMessage("disponible debe ser true o false")
        .bail().toBoolean(),
    query("orden").optional(opcional)
        .isIn(["nota", "anio", "titulo"]).withMessage("orden debe ser nota, anio o titulo"),
    query("page").optional(opcional)
        .isInt({ min: 1 }).withMessage("page debe ser un entero mayor o igual que 1")
        .bail().toInt(),
    // limit > 50 se recorta a 50 (comportamiento anterior, documentado como "máx. 50")
    query("limit").optional(opcional)
        .isInt({ min: 1 }).withMessage("limit debe ser un entero mayor o igual que 1")
        .bail().toInt()
        .customSanitizer(v => Math.min(v, LIMITE_MAX)),
    validar
];

module.exports = { validarListar };
