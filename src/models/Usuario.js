const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: [true, "Falta nombre"], trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password: {
        type: String,
        required: [true, "La contraseña es obligatoria"],
        // min es para numerbs y minlength es para caracteres
        minlength: [6, "La contraseña debe ser de mínimo 6 caracteres" ],
        select: false 
    },
    rol: {type: String, enum: ["usuario", "admin"], default: "usuario"}
});
// ANTES DE GUARDAR!! SI LA CONTRASEÑA HA SIDO CAMBIADA, SE GUARDA SU NUEVO HASH
usuarioSchema.pre("save", async function (){
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

class Usuario {

    async comprobarPassword(passwordEnClaro){
            return bcrypt.compare(passwordEnClaro, this.password);
    }
}

usuarioSchema.loadClass(Usuario);

//TJSON

usuarioSchema.set("toJSON", {
    transform(doc, ret) {
        return {
            id: doc.id,
            nombre: ret.nombre,
            email: ret.email,
            rol: ret.rol
        }
    }
});

module.exports = mongoose.model("Usuario", usuarioSchema );