require("dotenv").config({ quiet: true });
const { conectar, desconectar } = require("../src/config/config.js");
const Pelicula = require("../src/models/Pelicula.js");
const Usuario = require("../src/models/Usuario.js");
const Resena = require("../src/models/Resena.js");
const peliculas = require("./peliculas.json");

async function seed() {
    await conectar();

    await Resena.deleteMany({});
    await Usuario.deleteMany({});
    await Pelicula.deleteMany({});

    const pelis = await Pelicula.insertMany(peliculas);

   const [ana, luis] = await Usuario.create([
    { nombre: 'Ana', email: 'ana@lab.com', password: 'ana123' },
    { nombre: 'Luis', email: 'luis@lab.com', password: 'luis123' },
    { nombre: 'Admin', email: 'admin@lab.com', password: 'admin123', rol: 'admin' }
  ]);

    const interstellar = pelis[0];
    const origen = pelis[3];

    await Resena.insertMany([
        { pelicula: interstellar._id, usuario: ana._id, texto: "Me voló la cabeza", estrellas: 5 },
        { pelicula: interstellar._id, usuario: luis._id, texto: "Larga pero increíble", estrellas: 4 },
        { pelicula: origen._id, usuario: ana._id, texto: "Hay que verla dos veces", estrellas: 5 }
    ]);

    console.log(`${pelis.length} películas · 2 usuarios · 3 reseñas`);
    await desconectar();
}

seed().catch(error => {
    console.error(error.message);
    process.exit(1);
});
