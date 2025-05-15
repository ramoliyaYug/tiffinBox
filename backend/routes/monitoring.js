const express = require("express")
const router = express.Router()
const { protect, admin, student } = require("../middleware/auth")
const ExamSession = require("../models/ExamSession")
const MonitoringLog = require("../models/MonitoringLog")
const User = require("../models/User")
const Exam = require("../models/Exam")

// @route   GET /api/monitoring/:examId
// @desc    Get monitoring data for an exam (admin only)
// @access  Private/Admin
router.get("/:examId", protect, admin, async (req, res) => {
    try {
        // Find all active sessions for this exam
        const sessions = await ExamSession.find({
            examId: req.params.examId,
            completed: false,
        })

        // Get user data for each session
        const monitoringData = await Promise.all(
            sessions.map(async (session) => {
                const user = await User.findById(session.userId)

                // Calculate time left in minutes
                const elapsedMs = Date.now() - session.startTime
                const exam = await Exam.findById(session.examId)
                const totalTimeMs = exam.duration * 60 * 1000
                const timeLeftMs = Math.max(0, totalTimeMs - elapsedMs)
                const timeLeftMins = Math.ceil(timeLeftMs / (60 * 1000))

                return {
                    _id: session._id,
                    userId: session.userId,
                    name: user ? user.name : "Unknown User",
                    status: session.status,
                    warnings: session.warnings,
                    timeLeft: timeLeftMins,
                }
            }),
        )

        res.json(monitoringData)
    } catch (error) {
        console.error("Get monitoring data error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/monitoring/start
// @desc    Start a monitoring session
// @access  Private/Student
router.post("/start", protect, student, async (req, res) => {
    try {
        const { examId } = req.body

        // Check if there's already an active session
        const existingSession = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (existingSession) {
            // Log session start
            await MonitoringLog.create({
                sessionId: existingSession._id,
                userId: req.user._id,
                examId,
                eventType: "session_start",
            })

            return res.json({ message: "Monitoring session continued", sessionId: existingSession._id })
        }

        // Check if student has already completed this exam
        const completedSession = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: true,
        })

        if (completedSession) {
            return res.status(403).json({ message: "You have already completed this exam" })
        }

        // Create a new session
        const session = await ExamSession.create({
            userId: req.user._id,
            examId,
            startTime: Date.now(),
        })

        // Log session start
        await MonitoringLog.create({
            sessionId: session._id,
            userId: req.user._id,
            examId,
            eventType: "session_start",
        })

        res.status(201).json({ message: "Monitoring session started", sessionId: session._id })
    } catch (error) {
        console.error("Start monitoring error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/monitoring/update
// @desc    Update monitoring status
// @access  Private/Student
router.post("/update", protect, student, async (req, res) => {
    try {
        const { examId, timeLeft, warnings, currentQuestion } = req.body

        // Find active session
        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

        // Update status based on warnings
        if (warnings >= 2) {
            session.status = "flagged"
        } else if (warnings >= 1) {
            session.status = "warning"
        } else {
            session.status = "active"
        }

        // Update warnings count if provided
        if (warnings !== undefined) {
            session.warnings = warnings
        }

        await session.save()

        // Log status update
        await MonitoringLog.create({
            sessionId: session._id,
            userId: req.user._id,
            examId,
            eventType: "status_update",
            details: {
                timeLeft,
                warnings,
                currentQuestion,
                status: session.status,
            },
        })

        res.json({ message: "Status updated" })
    } catch (error) {
        console.error("Update monitoring error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/monitoring/warning
// @desc    Record a warning
// @access  Private/Student
router.post("/warning", protect, student, async (req, res) => {
    try {
        const { examId, message } = req.body

        // Find active session
        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

        // Increment warnings
        session.warnings += 1

        // Add to warning logs
        session.warningLogs.push({
            message,
            timestamp: Date.now(),
        })

        // Update status based on warnings
        if (session.warnings >= 2) {
            session.status = "flagged"
        } else {
            session.status = "warning"
        }

        await session.save()

        // Log warning
        await MonitoringLog.create({
            sessionId: session._id,
            userId: req.user._id,
            examId,
            eventType: "warning",
            details: { message },
        })

        res.json({ message: "Warning recorded", warningCount: session.warnings })
    } catch (error) {
        console.error("Record warning error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

// @route   POST /api/monitoring/end
// @desc    End a monitoring session
// @access  Private/Student
router.post("/end", protect, student, async (req, res) => {
    try {
        const { examId } = req.body

        // Find active session
        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

        // Log session end
        await MonitoringLog.create({
            sessionId: session._id,
            userId: req.user._id,
            examId,
            eventType: "session_end",
        })

        res.json({ message: "Monitoring session ended" })
    } catch (error) {
        console.error("End monitoring error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

module.exports = router
