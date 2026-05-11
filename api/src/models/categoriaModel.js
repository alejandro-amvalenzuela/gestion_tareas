const mongoose = require("mongoose");

const CategoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: "#10b981"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Categoria", CategoriaSchema);
