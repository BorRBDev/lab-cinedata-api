const mongoose = require("mongoose");
const Pelicula = require("../models/Pelicula.js");

function construirFiltro({genero, anioDesde, notaMin, disponible}){
    const filtro = {};
    if (genero) filtro.generos = genero;
    if (anioDesde) filtro.anio = {$gte: anioDesde};
    if (notaMin) filtro.nota = {$gte: notaMin};
    if (disponible !== undefined) filtro.disponible = disponible;
    return filtro; 
}


async function listar(filtros, orden, pagina, limite) {
    /*
    const filtro = genero ? { generos: genero } : {};
    const docs = await coleccion().find(filtro).sort({ nota: -1, titulo: 1 }).toArray();
    return docs.map(doc => new Pelicula(doc));*/

     const filtro = construirFiltro(filtros);
     const [peliculas, total] =  await Promise.all([
        Pelicula.find(filtro).sort(orden).skip((pagina - 1) * limite).limit(limite),
        Pelicula.countDocuments(filtro)
     ]);
     return { peliculas, total}; 
}

async function mejores(n = 3) {
  return Pelicula.find().sort({ nota: -1, titulo: 1}).limit(n);
}

// El _id (ObjectId) incluye la fecha de creación: _id descendente = últimas añadidas
async function recientes(n = 10) {
    return Pelicula.find().sort({ _id: -1 }).limit(n);
}

async function buscarPorTitulo(texto) {
    const escapado = texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return Pelicula.find({ titulo: { $regex: escapado, $options: "i" } })
        .sort({ anio: -1, titulo: 1 })
        .limit(20);
}

async function buscarPorId(id) {
    return Pelicula.findById(id);
}

// CREATE
async function crear(datos){
    return Pelicula.create(datos);
}

// UPDATE
async function actualizar(id, datos){
    // director se aplana a rutas con punto para no machacar el subdocumento entero
    // si solo se envía director.pais
    const { director, ...resto } = datos;
    const cambios = { ...resto };
    if (director) {
        for (const [clave, valor] of Object.entries(director)) cambios[`director.${clave}`] = valor;
    }
    return Pelicula.findByIdAndUpdate(id, { $set: cambios }, { returnDocument: "after", runValidators: true});
}

//DELETE
async function eliminar(id) {
    return Pelicula.findByIdAndDelete(id);
}

// FUNCIONES AUXILIARES
function esIdValido(id) {
    return mongoose.isValidObjectId(id);
}



module.exports = { listar, mejores, recientes, buscarPorTitulo, buscarPorId, esIdValido, crear, actualizar, eliminar };
