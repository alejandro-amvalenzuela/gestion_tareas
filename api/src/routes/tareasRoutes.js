const express = require("express");
const router = express.Router();

const tareasController = require("../controllers/tareasController");

router.get("/", tareasController.obtenerTareas);

router.post("/", tareasController.crearTarea);

router.put("/:id", tareasController.actualizarTarea);

router.delete("/:id", tareasController.eliminarTarea);

router.post("/:id/comentarios", tareasController.agregarComentario);

router.get("/:id/comentarios", tareasController.obtenerComentarios);

module.exports = router;