const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")

// Load environment variables
dotenv.config()

// Import routes
const authRoutes = require("./routes/auth")
const examRoutes = require("./routes/exams")
const monitoringRoutes = require("./routes/monitoring")

// Create Express app
const app = express()

// Middleware
// Configure CORS to allow requests from both development ports
app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"], // Allow both common development ports
        credentials: true,
    }),
)

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    console.log("Request headers:", req.headers)
    next()
})

app.use(express.json())

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
        console.error("MongoDB connection error:", err)
        console.error("Connection string:", process.env.MONGODB_URI)
        process.exit(1) // Exit process with failure
    })

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/exams", examRoutes)
app.use("/api/monitoring", monitoringRoutes)

// Handle preflight requests explicitly
app.options("*", cors())

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")))

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"))
    })
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err.stack)
    res.status(500).json({ message: "Something went wrong!", error: err.message })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
