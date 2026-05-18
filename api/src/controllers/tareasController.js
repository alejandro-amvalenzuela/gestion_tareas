const Tarea = require("../models/tareasModel");

// Obtiene tareas dependiendo del rol: el administrador ve todas, el usuario normal solo las asignadas a él
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

// Crea una nueva tarea validando que la fecha límite no sea anterior a hoy
exports.crearTarea = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (req.body.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(req.body.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
                return res.status(400).json({ mensaje: "La fecha límite no puede ser anterior a hoy" });
            }
        } else {
            req.body.dueDate = undefined;
        }

        if (!req.body.categoria) req.body.categoria = undefined;
        if (!req.body.assignedTo) req.body.assignedTo = undefined;

        const tarea = new Tarea({
            ...req.body,
            user: userId
        });
        await tarea.save();
        res.json(tarea);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear tarea", error });
    }
};

// Actualiza una tarea existente. Permite mantener fechas antiguas, pero valida si se asigna una nueva fecha pasada
exports.actualizarTarea = async (req, res) => {
    try {
        const tareaActual = await Tarea.findById(req.params.id);
        if (!tareaActual) return res.status(404).json({ mensaje: "Tarea no encontrada" });

        if (req.body.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newDueDate = new Date(req.body.dueDate);
            newDueDate.setHours(0, 0, 0, 0);
            
            // Solo validamos si está cambiando la fecha a una nueva fecha en el pasado
            const currentDueDate = tareaActual.dueDate ? new Date(tareaActual.dueDate) : null;
            if (currentDueDate) currentDueDate.setHours(0, 0, 0, 0);

            if (newDueDate < today && (!currentDueDate || newDueDate.getTime() !== currentDueDate.getTime())) {
                return res.status(400).json({ mensaje: "La fecha límite no puede ser anterior a hoy" });
            }
        } else if (req.body.dueDate === "") {
            req.body.dueDate = null;
        }

        if (req.body.categoria === "") req.body.categoria = null;
        if (req.body.assignedTo === "") req.body.assignedTo = null;

        const tarea = await Tarea.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(tarea);
    } catch (error) {
        console.error("Error al actualizar tarea:", error);
        res.status(500).json({ mensaje: "Error al actualizar tarea", error: error.message });
    }
};

// Elimina permanentemente una tarea de la base de datos
exports.eliminarTarea = async (req, res) => {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Tarea eliminada" });
};