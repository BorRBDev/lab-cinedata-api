const { query } = require("express-validator");

const validarEstadisticas = [
    query("minimo").optional().isInt({ min: 1, max: 5 }).withMessage("minimo debe ser un entero entre 1 y 5").toInt()
];

module.exports = { validarEstadisticas };
