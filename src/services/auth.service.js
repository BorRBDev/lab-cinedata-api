const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

function generarToken(usuario){
    return jwt.sign({ 
        id: usuario.id,
        rol: usuario.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN}
    );
}

async function registrar({nombre, email, password}) {
    const usuario = await Usuario.create({nombre, email, password});
    return({ usuario, token: generarToken(usuario)}); 
}

async function login(email, password) {
        const usuario = await Usuario.findOne({email}).select("+password");
        if (!usuario) return null;
        
        const coincide = await usuario.comprobarPassword(password);
        if (!coincide) return null;

        return { usuario, token: generarToken(usuario)};
}
async function buscarPorId(id) {
    return Usuario.findById(id);
}

module.exports = {registrar, login, buscarPorId};
