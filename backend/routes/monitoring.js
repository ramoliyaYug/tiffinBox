const express = require("express")
const router = express.Router()
const { protect, admin, student } = require("../middleware/auth")
const ExamSession = require("../models/ExamSession")
const MonitoringLog = require("../models/MonitoringLog")
const User = require("../models/User")
const Exam = require("../models/Exam")


router.get("/:examId", protect, admin, async (req, res) => {
    try {
       
        const sessions = await ExamSession.find({
            examId: req.params.examId,
            completed: false,
        })

        const monitoringData = await Promise.all(
            sessions.map(async (session) => {
                const user = await User.findById(session.userId)

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

router.post("/start", protect, student, async (req, res) => {
    try {
        const { examId } = req.body

        const existingSession = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (existingSession) {

            await MonitoringLog.create({
                sessionId: existingSession._id,
                userId: req.user._id,
                examId,
                eventType: "session_start",
            })

            return res.json({ message: "Monitoring session continued", sessionId: existingSession._id })
        }

        const completedSession = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: true,
        })

        if (completedSession) {
            return res.status(403).json({ message: "You have already completed this exam" })
        }

        const session = await ExamSession.create({
            userId: req.user._id,
            examId,
            startTime: Date.now(),
        })

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

router.post("/update", protect, student, async (req, res) => {
    try {
        const { examId, timeLeft, warnings, currentQuestion } = req.body

        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

        if (warnings >= 2) {
            session.status = "flagged"
        } else if (warnings >= 1) {
            session.status = "warning"
        } else {
            session.status = "active"
        }

        if (warnings !== undefined) {
            session.warnings = warnings
        }

        await session.save()

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

router.post("/warning", protect, student, async (req, res) => {
    try {
        const { examId, message } = req.body

        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

        session.warnings += 1

        session.warningLogs.push({
            message,
            timestamp: Date.now(),
        })

        if (session.warnings >= 2) {
            session.status = "flagged"
        } else {
            session.status = "warning"
        }

        await session.save()

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

router.post("/end", protect, student, async (req, res) => {
    try {
        const { examId } = req.body

        const session = await ExamSession.findOne({
            userId: req.user._id,
            examId,
            completed: false,
        })

        if (!session) {
            return res.status(404).json({ message: "No active session found" })
        }

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
