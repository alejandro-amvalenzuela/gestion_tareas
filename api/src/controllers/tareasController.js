const Tarea = require("../models/tareasModel");

// Obtener todas
exports.obtenerTareas = async (req, res) => {
    const tareas = await Tarea.find();
    res.json(tareas);
};

// Crear tarea
exports.crearTarea = async (req, res) => {
    const tarea = new Tarea(req.body);
    await tarea.save();
    res.json(tarea);
};

// Actualizar
exports.actualizarTarea = async (req, res) => {
    const tarea = await Tarea.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(tarea);
};

// Eliminar
exports.eliminarTarea = async (req, res) => {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Tarea eliminada" });
};