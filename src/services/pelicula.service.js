const mongoose = require("mongoose");
const Pelicula = require("../models/Pelicula.js");

function construirFiltro({genero, anioDesde, notaMin, disponible}){
    const filtro = {};
    if (genero) filtro.generos = genero;
    if (anioDesde) filtro.anio = {$gte: anioDesde};
    if (notaMin) filtro.nota = {$gte: notaMin};
    if (disponible !== undefined) {filtro.disponible = disponible === "true";
    console.log(disponible);}
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

async function estadisticasPorGenero(minimo) {
    const pipeline = [
        { $unwind: "$generos" },
        { $group: { _id: "$generos", total: { $sum: 1 }, notaMedia: { $avg: "$nota" } } }
    ];
    if (minimo !== undefined) pipeline.push({ $match: { total: { $gte: minimo } } });
    pipeline.push(
        { $sort: { notaMedia: -1, _id: 1 } },
        { $project: { _id: 0, genero: "$_id", total: 1, notaMedia: { $round: ["$notaMedia", 2] } } }
    );
    return Pelicula.aggregate(pipeline);
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
    return Pelicula.findByIdAndUpdate(id, datos, { returnDocument: "after", runValidators: true});
}

//DELETE
async function eliminar(id) {
    return Pelicula.findByIdAndDelete(id);
}

// FUNCIONES AUXILIARES
function esIdValido(id) {
    return mongoose.isValidObjectId(id);
}



module.exports = { listar, mejores, estadisticasPorGenero, buscarPorId, esIdValido, crear, actualizar, eliminar };
