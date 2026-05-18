const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    apellido: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 4,
        maxlength: 20,
        match: /^\S+$/
    },
    password: {
        type: String,
        required: true,
        match: /^\S+$/
    },
    rol: {
        type: String,
        enum: ["usuario", "administrador"],
        default: "usuario"
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("User", UserSchema);
