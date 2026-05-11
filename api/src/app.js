const express = require("express");
const cors = require("cors");
require("dotenv").config();

const conectarDB = require("./config/db");

const tareasRoutes = require("./routes/tareasRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const authController = require("./controllers/authController");
const categoriaController = require("./controllers/categoriaController");

const app = express();

// conectar DB
conectarDB().then(() => {
    // Inicializar datos por defecto
    authController.initAdmin();
    categoriaController.seed();
});

app.use(cors());
app.use(express.json());

app.use("/api/tareas", tareasRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/categorias", categoriaRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});