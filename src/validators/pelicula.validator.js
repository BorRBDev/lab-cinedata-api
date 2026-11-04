const { query, validationResult } = require("express-validator");

const validarEstadisticas = [
    query("minimo")
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("minimo debe ser un entero entre 1 y 5")
        .toInt()
];

function validar(req, res, next) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            error: "Datos no válidos",
            detalles: errores.array().map(e => e.msg)
        });
    }
    next();
}

module.exports = { validarEstadisticas, validar };
