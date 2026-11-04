const express = require("express");
const {registro, login, perfil} = require("../controller/auth.controller.js");
const autenticar = require("../middlewares/autenticar.js");

const router = express.Router();


// AQUI DEBBEIS COMENTAR SWAGGER, CUIDADO!!

router.post("/registro", registro);
router.post("/login", login);
router.get("/perfil", autenticar, perfil);


module.exports = router;