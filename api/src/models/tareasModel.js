const mongoose = require("mongoose");

const TareaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categoria"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed"],
        default: "pending"
    },
    tags: [String],
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true // Esto crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model("Tarea", TareaSchema);