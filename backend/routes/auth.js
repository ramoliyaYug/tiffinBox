const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const { protect } = require("../middleware/auth")
const User = require("../models/User")

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" })
        }

        // Check if user already exists
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: "User already exists" })
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || "student", // Default to student if no role provided
        })

        // Generate JWT token
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

        // Send more detailed error message
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message)
            return res.status(400).json({ message: messages.join(", ") })
        }

        res.status(500).json({ message: "Registration failed: " + error.message })
    }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        // Check for user
        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password)
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        // Generate JWT token
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

// @route   GET /api/auth/verify
// @desc    Verify token & get user data
// @access  Private
router.get("/verify", protect, async (req, res) => {
    try {
        res.json({ user: req.user })
    } catch (error) {
        console.error("Verify error:", error)
        res.status(500).json({ message: "Server error" })
    }
})

module.exports = router
