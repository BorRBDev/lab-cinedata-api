const express = require("express");
const peliculasRoutes = require("./routes/pelicula.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const logger = require("./middlewares/logger.js");
const noEncontrada = require("./middlewares/noEncontrada.js");
const manejarErrores = require("./middlewares/manejarErrores.js");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.js");
const cors = require("cors");

const app = express();

if (!process.env.CORS_ORIGIN || !process.env.CORS_ORIGIN.trim()) {
    throw new Error("Falta la variable de entorno CORS_ORIGIN (orígenes permitidos separados por comas)");
}
const origenesPermitidos = process.env.CORS_ORIGIN.split(",").map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: origenesPermitidos }));

app.use(express.json());
app.use(logger);

app.use("/peliculas", peliculasRoutes);
app.use("/auth", authRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use(noEncontrada);
app.use(manejarErrores);

module.exports = app;
