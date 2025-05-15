const mongoose = require("mongoose")

const monitoringLogSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamSession",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    eventType: {
        type: String,
        enum: ["tab_switch", "app_switch", "warning", "status_update", "session_start", "session_end"],
        required: true,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("MonitoringLog", monitoringLogSchema)