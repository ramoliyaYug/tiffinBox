const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    text: {
        type: String,
        required: [true, "Please add question text"],
        trim: true,
    },
    options: {
        type: [String],
        required: [true, "Please add options"],
        validate: [(val) => val.length >= 2, "Please add at least 2 options"],
    },
    correctAnswer: {
        type: Number,
        required: [true, "Please specify the correct answer index"],
    },
    points: {
        type: Number,
        default: 1,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("Question", questionSchema)
