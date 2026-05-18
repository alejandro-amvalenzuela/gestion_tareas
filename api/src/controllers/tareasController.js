const Tarea = require("../models/tareasModel");

// Función auxiliar para parsear fechas evitando desajustes de zona horaria (UTC vs Local)
const parseLocalDate = (dateVal) => {
    if (!dateVal) return null;
    let d;
    if (typeof dateVal === "string") {
        const parts = dateVal.split("-");
        if (parts.length === 3) {
            return new Date(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[2], 10)
            );
        }
        d = new Date(dateVal);
    } else {
        d = new Date(dateVal);
    }
    // Si la fecha representa la medianoche UTC (como los objetos Date guardados en Mongo),
    // extraemos sus componentes UTC para evitar el desajuste por zona horaria local.
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

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
            const dueDate = parseLocalDate(req.body.dueDate);
            if (dueDate < today) {
                return res.status(400).json({ mensaje: "La fecha límite no puede ser anterior a hoy" });
            }
        } else {
            req.body.dueDate = undefined;
        }

        if (!req.body.categoria) {
            return res.status(400).json({ mensaje: "La categoría es obligatoria" });
        }
        if (!req.body.assignedTo) {
            return res.status(400).json({ mensaje: "El responsable es obligatorio" });
        }

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
        const userRole = req.headers["x-user-role"];
        const tareaActual = await Tarea.findById(req.params.id);
        if (!tareaActual) return res.status(404).json({ mensaje: "Tarea no encontrada" });

        // Bloquear que un usuario no administrador reabra una tarea finalizada
        if (req.body.status && req.body.status !== tareaActual.status) {
            if (tareaActual.status === "completed" && userRole !== "administrador") {
                return res.status(403).json({ mensaje: "Solo un administrador puede reabrir una tarea finalizada" });
            }
        }

        if (req.body.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const newDueDate = parseLocalDate(req.body.dueDate);
            
            // Solo validamos si está cambiando la fecha a una nueva fecha en el pasado
            const currentDueDate = parseLocalDate(tareaActual.dueDate);

            if (newDueDate < today && (!currentDueDate || newDueDate.getTime() !== currentDueDate.getTime())) {
                return res.status(400).json({ mensaje: "La fecha límite no puede ser anterior a hoy" });
            }
        } else if (req.body.dueDate === "") {
            req.body.dueDate = null;
        }

        if (req.body.categoria === "" || req.body.categoria === null) {
            return res.status(400).json({ mensaje: "La categoría es obligatoria" });
        }
        if (req.body.assignedTo === "" || req.body.assignedTo === null) {
            return res.status(400).json({ mensaje: "El responsable es obligatorio" });
        }

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