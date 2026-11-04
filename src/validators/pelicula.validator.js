const { query, validationResult } = require("express-validator");

const validarEstadisticas = [
    query("minimo")
        .optional()
        .isString()
        .withMessage("minimo debe ser un entero entre 1 y 50")
        .bail()
        .isInt({ min: 1, max: 50 })
        .withMessage("minimo debe ser un entero entre 1 y 50")
        .toInt()
];

function validar(req, res, next) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            error: "Los datos no son validos",
            detalles: errores.array().map(e => e.msg)
        });
    }
    next();
}

module.exports = { validarEstadisticas, validar };
