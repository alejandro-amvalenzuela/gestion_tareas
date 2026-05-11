const Tarea = require("../models/tareasModel");

// Obtener todas por usuario
exports.obtenerTareas = async (req, res) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"]; 
    
    let query = {};
    if (userRole === "administrador") {
        // El admin ve TODAS las tareas
        query = {};
    } else {
        // El usuario normal ve las tareas que le asignaron
        query = { assignedTo: userId };
    }

    const tareas = await Tarea.find(query)
        .populate("categoria")
        .populate("assignedTo", "nombre apellido username")
        .populate("user", "nombre apellido"); // Populate del creador (quien asignó)
    res.json(tareas);
};

// Crear tarea
exports.crearTarea = async (req, res) => {
    const userId = req.headers["x-user-id"];
    const tarea = new Tarea({
        ...req.body,
        user: userId
    });
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