const mongoose = require("mongoose");
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

    // Consulta cuántas tareas activas (pending/in_progress) tiene un usuario antes de desactivarlo
    getPendingTasks: async (req, res) => {
        try {
            const tasks = await Tarea.find({
                assignedTo: req.params.id,
                status: { $ne: "completed" }
            }).select("title status");
            res.json({ pendingCount: tasks.length, tasks });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al consultar tareas del usuario" });
        }
    },

    // transacciones ACID: Alterna el estado y redistribuye tareas al desactivar
    toggleStatus: async (req, res) => {
        const session = await mongoose.startSession();
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

            const isDeactivating = user.activo;

            if (isDeactivating) {
                // Iniciar la transacción para redistribución segura de tareas
                session.startTransaction();

                // 1. Encontrar todos los otros usuarios activos que puedan recibir las tareas
                const activeUsers = await User.find({ 
                    _id: { $ne: req.params.id }, 
                    activo: true,
                    rol: "usuario"
                }).session(session);

                // 2. Encontrar todas las tareas pendientes o en progreso asignadas al usuario que se desactivará
                const pendingTasks = await Tarea.find({ 
                    assignedTo: req.params.id, 
                    status: { $ne: "completed" } 
                }).session(session);

                if (pendingTasks.length > 0) {
                    // Si hay tareas que reasignar pero no hay otros usuarios activos en el sistema, se cancela la desactivación
                    if (activeUsers.length === 0) {
                        await session.abortTransaction();
                        session.endSession();
                        return res.status(400).json({ 
                            mensaje: "No se puede desactivar al usuario porque tiene tareas pendientes y no existen otros usuarios activos en el sistema para asignárselas." 
                        });
                    }

                    // 3. Redistribuir las tareas (usando reasignación manual si se proporciona)
                    const reassignments = req.body.reassignments || {};
                    for (let i = 0; i < pendingTasks.length; i++) {
                        const task = pendingTasks[i];
                        const targetUserId = reassignments[task._id.toString()];
                        if (targetUserId) {
                            task.assignedTo = targetUserId;
                        } else {
                            const recipient = activeUsers[i % activeUsers.length];
                            task.assignedTo = recipient._id;
                        }
                        await task.save({ session });
                    }
                }

                // 4. Desactivar el usuario
                const updatedUser = await User.findByIdAndUpdate(
                    req.params.id,
                    { activo: false },
                    { new: true, session }
                ).select("-password");

                // Confirmar transacción
                await session.commitTransaction();
                session.endSession();

                return res.json({ 
                    mensaje: `Usuario desactivado correctamente. Se redistribuyeron ${pendingTasks.length} tareas pendientes entre los miembros activos del equipo.`, 
                    user: updatedUser 
                });
            } else {
                // Si solo se está reactivando al usuario, no es necesario hacer ninguna redistribución de tareas
                const updatedUser = await User.findByIdAndUpdate(
                    req.params.id,
                    { activo: true },
                    { new: true }
                ).select("-password");

                return res.json({ mensaje: "Usuario activado correctamente", user: updatedUser });
            }

        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            // Fallback para entornos locales de MongoDB que no están configurados como Replica Set
            if (error.message && (error.message.includes("replica set") || error.message.includes("Transaction numbers"))) {
                console.warn("MongoDB no soporta transacciones (standalone). Ejecutando operaciones de forma secuencial sin transacción...");
                try {
                    const user = await User.findById(req.params.id);
                    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

                    const isDeactivating = user.activo;
                    if (isDeactivating) {
                        const activeUsers = await User.find({ _id: { $ne: req.params.id }, activo: true, rol: "usuario" });
                        const pendingTasks = await Tarea.find({ assignedTo: req.params.id, status: { $ne: "completed" } });

                        if (pendingTasks.length > 0) {
                            if (activeUsers.length === 0) {
                                return res.status(400).json({ 
                                    mensaje: "No se puede desactivar al usuario porque tiene tareas pendientes y no existen otros usuarios activos en el sistema para asignárselas." 
                                });
                            }

                            const reassignments = req.body.reassignments || {};
                            for (let i = 0; i < pendingTasks.length; i++) {
                                const task = pendingTasks[i];
                                const targetUserId = reassignments[task._id.toString()];
                                if (targetUserId) {
                                    task.assignedTo = targetUserId;
                                } else {
                                    const recipient = activeUsers[i % activeUsers.length];
                                    task.assignedTo = recipient._id;
                                }
                                await task.save();
                            }
                        }

                        const updatedUser = await User.findByIdAndUpdate(
                            req.params.id,
                            { activo: false },
                            { new: true }
                        ).select("-password");

                        return res.json({ 
                            mensaje: `Usuario desactivado correctamente. Se redistribuyeron ${pendingTasks.length} tareas pendientes (secuencial sin transacción).`, 
                            user: updatedUser 
                        });
                    } else {
                        const updatedUser = await User.findByIdAndUpdate(
                            req.params.id,
                            { activo: true },
                            { new: true }
                        ).select("-password");

                        return res.json({ mensaje: "Usuario activado correctamente", user: updatedUser });
                    }
                } catch (fallbackError) {
                    console.error("Error en fallback de desactivación de usuario:", fallbackError);
                    return res.status(500).json({ mensaje: "Error al cambiar estado de usuario (modo fallback)" });
                }
            }

            console.error("Error en toggleStatus con transacción:", error);
            res.status(500).json({ mensaje: "Error al cambiar estado del usuario con transacción" });
        }
    }
};

module.exports = userController;
