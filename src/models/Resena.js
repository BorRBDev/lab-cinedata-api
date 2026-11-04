const mongoose = require("mongoose");


const resenaSchema = mongoose.Schema({
    pelicula: { type: mongoose.Schema.Types.ObjectId, ref: "Pelicula", required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    texto: { type: String, required: true },
    estrellas: { type: Number, required: true, min: 0, max: 5 },
}, { timestamps: true });

class Resena {
    get valoracion() {
        return "*".repeat(this.estrellas) + "0".repeat(5 - this.estrellas);
    }
}

resenaSchema.loadClass(Resena);


resenaSchema.set("toJSON", {
    transform(doc, ret) {
        return {
            usuario: doc.usuario?.nombre,
            pelicula: doc.pelicula?.titulo,
            texto: ret.texto,
            estrellas: ret.estrellas,
            valoracion: doc.valoracion
        };
    }
});

module.exports = mongoose.model("Resena", resenaSchema);