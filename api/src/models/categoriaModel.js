const mongoose = require("mongoose");

const CategoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: 50
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Categoria", CategoriaSchema);
