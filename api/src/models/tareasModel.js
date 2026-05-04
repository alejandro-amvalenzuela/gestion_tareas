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
    project: {
        name: { type: String, default: "General" }
    },
    assignedTo: {
        name: { type: String, default: "Sin asignar" }
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
    }
}, {
    timestamps: true // Esto crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model("Tarea", TareaSchema);