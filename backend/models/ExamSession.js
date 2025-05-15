const mongoose = require("mongoose")

const examSessionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    forcedSubmission: {
        type: Boolean,
        default: false,
    },
    answers: {
        type: Map,
        of: Number,
        default: {},
    },
    score: {
        type: Number,
    },
    warnings: {
        type: Number,
        default: 0,
    },
    warningLogs: [
        {
            message: String,
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ["active", "warning", "flagged", "completed"],
        default: "active",
    },
})

module.exports = mongoose.model("ExamSession", examSessionSchema)
