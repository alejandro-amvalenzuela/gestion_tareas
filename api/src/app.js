const express = require("express");
const cors = require("cors");
require("dotenv").config();

const conectarDB = require("./config/db");

const tareasRoutes = require("./routes/tareasRoutes");

const app = express();

// conectar DB
conectarDB();

app.use(cors());
app.use(express.json());

app.use("/api/tareas", tareasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});