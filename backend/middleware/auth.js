const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware to verify JWT token
exports.protect = async (req, res, next) => {
    let token

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" })
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user from token
        req.user = await User.findById(decoded.id).select("-password")

        if (!req.user) {
            return res.status(401).json({ message: "User not found" })
        }

        next()
    } catch (error) {
        console.error("Auth middleware error:", error)
        return res.status(401).json({ message: "Not authorized, token failed" })
    }
}

// Middleware to check if user is admin
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next()
    } else {
        return res.status(403).json({ message: "Not authorized as admin" })
    }
}

// Middleware to check if user is a student
exports.student = (req, res, next) => {
    if (req.user && req.user.role === "student") {
        next()
    } else {
        return res.status(403).json({ message: "Not authorized as student" })
    }
}
