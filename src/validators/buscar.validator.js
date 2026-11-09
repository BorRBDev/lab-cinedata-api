const { query, validationResult } = require("express-validator");

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

const validarBuscar = [
    query("q")
        .exists().withMessage("El parámetro q es obligatorio")
        .bail()
        .isString().withMessage("q debe ser texto")
        .bail()
        .trim()
        .isLength({ min: 2, max: 30 }).withMessage("q debe tener entre 2 y 30 caracteres"),
    validar
];

module.exports = { validarBuscar, validar };
