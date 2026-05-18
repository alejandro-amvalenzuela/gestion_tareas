const User = require("../models/userModel");

const authController = {
    // Autentica un usuario validando sus credenciales y que su cuenta esté activa (activo=true)
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = await User.findOne({ username });

            // Validación de seguridad genérica para prevenir enumeración de usuarios
            if (!user || user.password !== password) {
                return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
            }

            if (!user.activo) {
                return res.status(403).json({ mensaje: "El usuario no tiene permiso para acceder al sistema" });
            }

            // Devolvemos la info del usuario (sin password por seguridad mínima)
            const userResponse = {
                _id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                username: user.username,
                rol: user.rol
            };

            res.json({
                mensaje: "Login exitoso",
                user: userResponse
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: "Error en el servidor" });
        }
    },

    // Crea un usuario administrador de sistema por defecto en el primer inicio de la app
    initAdmin: async () => {
        try {
            const adminExists = await User.findOne({ username: "admin" });

            if (!adminExists) {
                const adminUser = new User({
                    nombre: "Admin",
                    apellido: "Sistema",
                    username: "admin",
                    password: "12345",
                    rol: "administrador",
                    activo: true
                });

                await adminUser.save();
                console.log("Usuario administrador creado por defecto: admin/12345");
            }
        } catch (error) {
            console.error("Error al inicializar admin:", error);
        }
    }
};

module.exports = authController;
