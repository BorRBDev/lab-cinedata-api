const authService = require("../services/auth.service.js");

async function registro(req, res){
    const resultado = await authService.registrar(req.body);
    res.status(201).json(resultado);
}

async function login(req, res) {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({error: "Email o password OBLIGATORIO"});
    }
    const resultado = await authService.login(email, password);
    if(!resultado){
        return res.status(401).json({error: "Email o contraseñas incorrectos"});
    }
    res.json(resultado);
}
async function perfil(req, res) {
    const usuario = await authService.buscarPorId(req.usuario.id);
    if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(usuario);
}  

module.exports = {registro, login, perfil};