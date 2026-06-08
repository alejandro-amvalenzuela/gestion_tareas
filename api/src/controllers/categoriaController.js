const mongoose = require("mongoose");
const Categoria = require("../models/categoriaModel");
const Tarea = require("../models/tareasModel");

const categoriaController = {
    // Obtiene todas las categorías disponibles con la cantidad de tareas asignadas
    getAll: async (req, res) => {
        try {
            const categorias = await Categoria.find().lean();
            
            // Mapeamos las categorías y contamos las tareas asignadas a cada una
            const categoriasConConteo = await Promise.all(
                categorias.map(async (cat) => {
                    const count = await Tarea.countDocuments({ categoria: cat._id });
                    return {
                        ...cat,
                        tareasCount: count
                    };
                })
            );
            
            res.json(categoriasConConteo);
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

    // transacciones ACID: Eliminación segura de categoría con reasignación
    delete: async (req, res) => {
        // Se inicia una sesión de Mongoose para manejar la transacción
        const session = await mongoose.startSession();
        try {
            // Se comienza la transacción. Cualquier fallo abortará todas las operaciones.
            session.startTransaction();

            // 1. Buscar la categoría a eliminar dentro de la sesión de transacción
            const categoriaADelete = await Categoria.findById(req.params.id).session(session);
            if (!categoriaADelete) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ mensaje: "Categoría no encontrada" });
            }

            // 2. Prevenir la eliminación de la categoría "General" que actúa como fallback
            if (categoriaADelete.nombre.toLowerCase() === "general") {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    mensaje: "No se puede eliminar la categoría por defecto (General)" 
                });
            }

            // 3. Buscar o crear la categoría de destino "General" para reasignar las tareas
            let categoriaGeneral = await Categoria.findOne({ 
                nombre: { $regex: new RegExp("^General$", "i") } 
            }).session(session);

            if (!categoriaGeneral) {
                categoriaGeneral = new Categoria({
                    nombre: "General",
                    descripcion: "Categoría por defecto para tareas reasignadas"
                });
                // Se guarda la nueva categoría dentro del contexto de la sesión/transacción
                await categoriaGeneral.save({ session });
            }

            // 4. Reasignar de forma masiva todas las tareas vinculadas a la categoría de destino
            const updateResult = await Tarea.updateMany(
                { categoria: req.params.id },
                { categoria: categoriaGeneral._id },
                { session }
            );

            // 5. Eliminar la categoría original una vez que las tareas han sido reasignadas con seguridad
            await Categoria.findByIdAndDelete(req.params.id).session(session);

            // Se confirma la transacción para guardar todos los cambios en la base de datos
            await session.commitTransaction();
            session.endSession();

            res.json({ 
                mensaje: `Categoría eliminada con éxito. Se reasignaron ${updateResult.modifiedCount} tareas a la categoría 'General'.` 
            });

        } catch (error) {
            // Si algo falla, se revierten todos los cambios realizados (rollback)
            await session.abortTransaction();
            session.endSession();

            // Fallback para entornos locales de MongoDB que no están configurados como Replica Set
            if (error.message && (error.message.includes("replica set") || error.message.includes("Transaction numbers"))) {
                console.warn("MongoDB no soporta transacciones (standalone). Ejecutando operaciones de forma secuencial sin transacción...");
                try {
                    const categoriaADelete = await Categoria.findById(req.params.id);
                    if (!categoriaADelete) {
                        return res.status(404).json({ mensaje: "Categoría no encontrada" });
                    }
                    if (categoriaADelete.nombre.toLowerCase() === "general") {
                        return res.status(400).json({ mensaje: "No se puede eliminar la categoría por defecto (General)" });
                    }
                    let categoriaGeneral = await Categoria.findOne({ nombre: { $regex: new RegExp("^General$", "i") } });
                    if (!categoriaGeneral) {
                        categoriaGeneral = new Categoria({
                            nombre: "General",
                            descripcion: "Categoría por defecto para tareas reasignadas"
                        });
                        await categoriaGeneral.save();
                    }
                    const updateResult = await Tarea.updateMany(
                        { categoria: req.params.id },
                        { categoria: categoriaGeneral._id }
                    );
                    await Categoria.findByIdAndDelete(req.params.id);
                    return res.json({ 
                        mensaje: `Categoría eliminada con éxito. Se reasignaron ${updateResult.modifiedCount} tareas a la categoría 'General' (secuencial sin transacción).` 
                    });
                } catch (fallbackError) {
                    console.error("Error en fallback de eliminación de categoría:", fallbackError);
                    return res.status(500).json({ mensaje: "Error al eliminar categoría (modo fallback)" });
                }
            }

            console.error("Error al eliminar categoría con transacción:", error);
            res.status(500).json({ mensaje: "Error al eliminar categoría con transacción" });
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
