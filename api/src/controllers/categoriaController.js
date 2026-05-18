const Categoria = require("../models/categoriaModel");
const Tarea = require("../models/tareasModel");

const categoriaController = {
    // Obtiene todas las categorías disponibles
    getAll: async (req, res) => {
        try {
            const categorias = await Categoria.find();
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener categorías" });
        }
    },

    // Crea una nueva categoría validando que no exista otra con el mismo nombre (ignorando mayúsculas)
    create: async (req, res) => {
        try {
            const existe = await Categoria.findOne({ nombre: { $regex: new RegExp(`^${req.body.nombre}$`, "i") } });
            if (existe) {
                return res.status(400).json({ mensaje: "La categoría ya existe" });
            }

            const nueva = new Categoria(req.body);
            await nueva.save();
            res.json(nueva);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ mensaje: "La categoría ya existe" });
            }
            res.status(500).json({ mensaje: "Error al crear categoría" });
        }
    },

    // Actualiza una categoría previniendo conflictos de nombres duplicados
    update: async (req, res) => {
        try {
            const existe = await Categoria.findOne({ nombre: { $regex: new RegExp(`^${req.body.nombre}$`, "i") } });
            if (existe && existe._id.toString() !== req.params.id) {
                return res.status(400).json({ mensaje: "La categoría ya existe" });
            }

            const actualizada = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(actualizada);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ mensaje: "La categoría ya existe" });
            }
            res.status(500).json({ mensaje: "Error al actualizar categoría" });
        }
    },

    // Elimina una categoría por su ID
    delete: async (req, res) => {
        try {
            // Verificar si hay alguna tarea vinculada a esta categoría
            const tareasVinculadas = await Tarea.findOne({ categoria: req.params.id });
            if (tareasVinculadas) {
                return res.status(400).json({ 
                    mensaje: "No se puede eliminar la categoría porque tiene tareas asociadas" 
                });
            }

            await Categoria.findByIdAndDelete(req.params.id);
            res.json({ mensaje: "Categoría eliminada" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar categoría" });
        }
    },

    // Función ejecutada al arrancar la API para inyectar categorías por defecto si la colección está vacía
    seed: async () => {
        try {
            const count = await Categoria.countDocuments();
            if (count === 0) {
                const defaults = [
                    { nombre: "Trabajo" },
                    { nombre: "Personal" },
                    { nombre: "Urgente" },
                    { nombre: "Estudio" }
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
