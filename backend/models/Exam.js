const mongoose = require("mongoose")

const examSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    duration: {
        type: Number,
        required: [true, "Please add a duration in minutes"],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

examSchema.virtual("questionCount").get(function () {
    return this.questions ? this.questions.length : 0
})

examSchema.set("toJSON", { virtuals: true })
examSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Exam", examSchema)
