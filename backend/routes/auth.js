const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const { protect } = require("../middleware/auth")
const User = require("../models/User")

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" })
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: "User already exists" })
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "student", 
        })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        })

        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        })
    } catch (error) {
        console.error("Register error:", error)

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message)
            return res.status(400).json({ message: messages.join(", ") })
        }

        res.status(500).json({ message: "Registration failed: " + error.message })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const isMatch = await user.matchPassword(password)
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        })

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

router.get("/verify", protect, async (req, res) => {
    try {
        res.json({ user: req.user })
    } catch (error) {
        console.error("Verify error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

module.exports = router
