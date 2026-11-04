const mongoose = require("mongoose");

//ESTO ES EL SCHEMA

const peliculasSchema = mongoose.Schema({
  titulo: { type: String, required: [true, "Es obligatorio"], trim: true },
  anio: { type: Number, required: [true, "Dime el año"], min: 1900, max: 2100 },
  generos: { type: [String], default: [] },
  nota: { type: Number, min: [0, 'La nota mínima es 0'], max: [10, 'La nota máxima es 10'] },
  duracion: { type: Number, min: 1 },
  director: {
    nombre: { type: String, required: true },
    pais: String
  },
  disponible: { type: Boolean, default: true }
});

class Pelicula {

    get duracionTexto(){
      if (!this.duracion) return null;
      return `${Math.floor(this.duracion / 60)}h ${this.duracion % 60} min`;
    }

    esGenero(genero) {
      return this.generos.includes(genero);
    }

    resumen(){
      return {
        id: this.id, 
        titulo: this.titulo,
        anio: this.anio,
        nota: this.nota,
        duracion: this.duracion,
        director: this.director
      };
    }
}

 peliculasSchema.loadClass(Pelicula);

 peliculasSchema.set("toJSON", {
  versionKey: false,
  transform(doc, ret){
    return{
      id: doc.id,
      titulo: ret.titulo,
      anio: ret.anio,
      generos: ret.generos,
      nota: ret.nota,
      duracion: doc.duracionTexto,
      director: ret.director?.nombre,
      disponible: ret.disponible
    }
  }
 });

 module.exports = mongoose.model("Pelicula", peliculasSchema);
