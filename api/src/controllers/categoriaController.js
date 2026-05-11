const Categoria = require("../models/categoriaModel");

const categoriaController = {
    getAll: async (req, res) => {
        try {
            const categorias = await Categoria.find();
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener categorías" });
        }
    },

    create: async (req, res) => {
        try {
            const nueva = new Categoria(req.body);
            await nueva.save();
            res.json(nueva);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al crear categoría" });
        }
    },

    update: async (req, res) => {
        try {
            const actualizada = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(actualizada);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar categoría" });
        }
    },

    delete: async (req, res) => {
        try {
            await Categoria.findByIdAndDelete(req.params.id);
            res.json({ mensaje: "Categoría eliminada" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar categoría" });
        }
    },

    seed: async () => {
        try {
            const count = await Categoria.countDocuments();
            if (count === 0) {
                const defaults = [
                    { nombre: "Trabajo", color: "#2563eb" },
                    { nombre: "Personal", color: "#10b981" },
                    { nombre: "Urgente", color: "#dc2626" },
                    { nombre: "Estudio", color: "#8b5cf6" }
                ];
                await Categoria.insertMany(defaults);
                console.log("Categorías por defecto insertadas");
            }
        } catch (error) {
            console.error("Error al insertar categorías:", error);
        }
    }
};

module.exports = categoriaController;
