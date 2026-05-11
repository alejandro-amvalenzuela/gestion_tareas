const User = require("../models/userModel");

const userController = {
    getAll: async (req, res) => {
        try {
            const users = await User.find().select("-password");
            res.json(users);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener usuarios" });
        }
    },

    create: async (req, res) => {
        try {
            const newUser = new User(req.body);
            await newUser.save();
            res.json(newUser);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al crear usuario" });
        }
    },

    update: async (req, res) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            ).select("-password");
            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar usuario" });
        }
    },

    delete: async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.json({ mensaje: "Usuario eliminado" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar usuario" });
        }
    },

    toggleStatus: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
            
            user.activo = !user.activo;
            await user.save();
            res.json({ mensaje: `Usuario ${user.activo ? 'activado' : 'desactivado'}`, user });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al cambiar estado" });
        }
    }
};

module.exports = userController;
