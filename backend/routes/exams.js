const express = require("express")
const router = express.Router()
const { protect, admin, student } = require("../middleware/auth")
const Exam = require("../models/Exam")
const Question = require("../models/Question")
const ExamSession = require("../models/ExamSession")
const mongoose = require("mongoose")

// @route   GET /api/exams
// @desc    Get all exams (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 })

        // Get question count for each exam
        const examsWithQuestionCount = await Promise.all(
            exams.map(async (exam) => {
                const count = await Question.countDocuments({ examId: exam._id })
                return {
                    ...exam.toObject(),
                    questionCount: count,
                }
            }),
        )

        res.json(examsWithQuestionCount)
    } catch (error) {
        console.error("Get exams error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   GET /api/exams/available
// @desc    Get available exams for students
// @access  Private/Student
router.get("/available", protect, student, async (req, res) => {
    try {
        // Get all active exams
        const exams = await Exam.find({ active: true }).sort({ createdAt: -1 })

        // Get exams that the student has already completed
        const completedSessions = await ExamSession.find({
            userId: req.user._id,
            completed: true,
        }).select("examId")

        const completedExamIds = completedSessions.map((session) => session.examId.toString())

        // Filter out completed exams
        const availableExams = exams.filter((exam) => !completedExamIds.includes(exam._id.toString()))

        // Get question count for each exam
        const examsWithQuestionCount = await Promise.all(
            availableExams.map(async (exam) => {
                const count = await Question.countDocuments({ examId: exam._id })
                return {
                    ...exam.toObject(),
                    questionCount: count,
                }
            }),
        )

        res.json(examsWithQuestionCount)
    } catch (error) {
        console.error("Get available exams error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   GET /api/exams/completed
// @desc    Get completed exams for a student
// @access  Private/Student
router.get("/completed", protect, student, async (req, res) => {
    try {
        // Get all completed exam sessions for this student
        const completedSessions = await ExamSession.find({
            userId: req.user._id,
            completed: true,
        }).sort({ endTime: -1 })

        // Get exam details for each session
        const completedExams = await Promise.all(
            completedSessions.map(async (session) => {
                const exam = await Exam.findById(session.examId)
                return {
                    _id: session._id,
                    examId: session.examId,
                    examName: exam ? exam.name : "Unknown Exam",
                    score: session.score,
                    completedAt: session.endTime,
                    forcedSubmission: session.forcedSubmission,
                }
            }),
        )

        res.json(completedExams)
    } catch (error) {
        console.error("Get completed exams error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { name, description, duration, questions } = req.body

        // Validate input
        if (!name || !description || !duration) {
            return res.status(400).json({ message: "Please provide all required exam fields" })
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Please provide at least one question" })
        }

        // Create exam
        const exam = await Exam.create(
            [
                {
                    name,
                    description,
                    duration,
                    createdBy: req.user._id,
                    active: true, // Default to active
                },
            ],
            { session },
        )

        // Create questions
        const questionDocs = questions.map((q) => ({
            examId: exam[0]._id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points || 1, // Default to 1 point if not specified
        }))

        await Question.insertMany(questionDocs, { session })

        await session.commitTransaction()
        session.endSession()

        res.status(201).json({
            _id: exam[0]._id,
            name: exam[0].name,
            description: exam[0].description,
            duration: exam[0].duration,
            questionCount: questions.length,
        })
    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        console.error("Create exam error:", error)
        res.status(500).json({ message: "Failed to create exam: " + error.message })
    }
})

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" })
        }

        // Check if user is admin or if exam is active for students
        if (req.user.role !== "admin" && !exam.active) {
            return res.status(403).json({ message: "Exam is not available" })
        }

        // Get question count
        const questionCount = await Question.countDocuments({ examId: exam._id })

        res.json({
            ...exam.toObject(),
            questionCount,
        })
    } catch (error) {
        console.error("Get exam error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   GET /api/exams/:id/questions
// @desc    Get questions for an exam
// @access  Private
router.get("/:id/questions", protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" })
        }

        // Check if user is admin or if exam is active for students
        if (req.user.role !== "admin" && !exam.active) {
            return res.status(403).json({ message: "Exam is not available" })
        }

        // For students, check if they have an active session or have already completed this exam
        if (req.user.role === "student") {
            // Check if student has already completed this exam
            const completedSession = await ExamSession.findOne({
                userId: req.user._id,
                examId: exam._id,
                completed: true,
            })

            if (completedSession) {
                return res.status(403).json({ message: "You have already completed this exam" })
            }

            // Check for active session or create one
            const session = await ExamSession.findOne({
                userId: req.user._id,
                examId: exam._id,
                completed: false,
            })

            if (!session) {
                // Create a new session for this student
                await ExamSession.create({
                    userId: req.user._id,
                    examId: exam._id,
                    startTime: Date.now(),
                })
            }
        }

        // Get questions for the exam
        const questions = await Question.find({ examId: exam._id })

        // For students, don't include correct answers
        if (req.user.role === "student") {
            const questionsWithoutAnswers = questions.map((q) => ({
                _id: q._id,
                examId: q.examId,
                text: q.text,
                options: q.options,
            }))

            return res.json(questionsWithoutAnswers)
        }

        res.json(questions)
    } catch (error) {
        console.error("Get questions error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/exams/:id/answer
// @desc    Save a student's answer for a question
// @access  Private/Student
router.post("/:id/answer", protect, student, async (req, res) => {
    try {
        const { questionId, answer } = req.body

        // Find active session
        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId: req.params.id,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active exam session found" })
        }

        // Update the answer in the session
        session.answers.set(questionId, answer)
        await session.save()

        res.json({ message: "Answer saved" })
    } catch (error) {
        console.error("Save answer error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/exams/:id/submit
// @desc    Submit an exam
// @access  Private/Student
router.post("/:id/submit", protect, student, async (req, res) => {
    try {
        const { forced, warnings } = req.body

        // Find active session
        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId: req.params.id,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active exam session found" })
        }

        // Get all questions for this exam
        const questions = await Question.find({ examId: req.params.id })

        // Calculate score
        let score = 0
        let totalPoints = 0

        questions.forEach((question) => {
            totalPoints += question.points

            const studentAnswer = session.answers.get(question._id.toString())
            if (studentAnswer !== undefined && studentAnswer === question.correctAnswer) {
                score += question.points
            }
        })

        // Convert to percentage
        const scorePercentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

        // Update session
        session.completed = true
        session.endTime = Date.now()
        session.forcedSubmission = !!forced
        session.score = scorePercentage
        session.warnings = warnings || session.warnings

        await session.save()

        res.json({
            message: "Exam submitted successfully",
            score: scorePercentage,
        })
    } catch (error) {
        console.error("Submit exam error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   PUT /api/exams/:id
// @desc    Update an exam
// @access  Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const { name, description, duration, active } = req.body

        const exam = await Exam.findById(req.params.id)

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" })
        }

        // Update fields
        if (name) exam.name = name
        if (description !== undefined) exam.description = description
        if (duration) exam.duration = duration
        if (active !== undefined) exam.active = active

        await exam.save()

        res.json(exam)
    } catch (error) {
        console.error("Update exam error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   DELETE /api/exams/:id
// @desc    Delete an exam
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const exam = await Exam.findById(req.params.id)

        if (!exam) {
            return res.status(404).json({ message: "Exam not found" })
        }

        // Delete exam, questions, and sessions
        await Question.deleteMany({ examId: exam._id }, { session })
        await ExamSession.deleteMany({ examId: exam._id }, { session })
        await Exam.deleteOne({ _id: exam._id }, { session })

        await session.commitTransaction()
        session.endSession()

        res.json({ message: "Exam deleted" })
    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        console.error("Delete exam error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

module.exports = router
