const User = require("../models/userModel");
const Tarea = require("../models/tareasModel");

const userController = {
    // Obtiene la lista de todos los usuarios (excluyendo contraseñas por seguridad)
    getAll: async (req, res) => {
        try {
            const users = await User.find().select("-password");
            res.json(users);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener usuarios" });
        }
    },

    // Crea un nuevo usuario validando campos requeridos y duplicados
    create: async (req, res) => {
        try {
            const newUser = new User(req.body);
            await newUser.save();
            res.json(newUser);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ mensaje: "El nombre de usuario ya existe" });
            }
            res.status(500).json({ mensaje: "Error al crear usuario" });
        }
    },

    // Actualiza los datos de un usuario existente
    update: async (req, res) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            ).select("-password");
            res.json(updatedUser);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ mensaje: "El nombre de usuario ya existe" });
            }
            res.status(500).json({ mensaje: "Error al actualizar usuario" });
        }
    },

    // Elimina un usuario por su ID
    delete: async (req, res) => {
        try {
            // Verificar si el usuario tiene tareas creadas
            const tareasCreadas = await Tarea.findOne({ user: req.params.id });
            if (tareasCreadas) {
                return res.status(400).json({ 
                    mensaje: "No se puede eliminar el usuario porque ha creado tareas en el sistema" 
                });
            }

            // Verificar si el usuario tiene tareas asignadas
            const tareasAsignadas = await Tarea.findOne({ assignedTo: req.params.id });
            if (tareasAsignadas) {
                return res.status(400).json({ 
                    mensaje: "No se puede eliminar el usuario porque tiene tareas asignadas" 
                });
            }

            await User.findByIdAndDelete(req.params.id);
            res.json({ mensaje: "Usuario eliminado" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar usuario" });
        }
    },

    // Alterna el estado activo/inactivo de un usuario (para permitir o denegar su acceso al sistema)
    toggleStatus: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
            
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { activo: !user.activo },
                { new: true }
            );
            res.json({ mensaje: `Usuario ${updatedUser.activo ? 'activado' : 'desactivado'}`, user: updatedUser });
        } catch (error) {
            console.error("Error en toggleStatus:", error);
            res.status(500).json({ mensaje: "Error al cambiar estado" });
        }
    }
};

module.exports = userController;
