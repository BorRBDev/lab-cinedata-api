const { esIdValido } = require("../services/pelicula.service.js");

function validarId(req, res, next) {
    if (!esIdValido(req.params.id)) {
        return res.status(400).json({ error: "El id no tiene formato válido" });
    }
    next();
}

module.exports = validarId;
