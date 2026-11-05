const { validationResult } = require("express-validator");

function validar(req, res, next) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        const detalle = errores.array().map(e => ({ campo: e.path, mensaje: e.msg }));
        return res.status(400).json({ error: detalle[0].mensaje, errores: detalle });
    }
    next();
}

module.exports = validar;
