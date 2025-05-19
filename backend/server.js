const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")


dotenv.config()


const authRoutes = require("./routes/auth")
const examRoutes = require("./routes/exams")
const monitoringRoutes = require("./routes/monitoring")

const app = express()
app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"], 
        credentials: true,
    }),
)

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    console.log("Request headers:", req.headers)
    next()
})

app.use(express.json())

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
        console.error("MongoDB connection error:", err)
        console.error("Connection string:", process.env.MONGODB_URI)
        process.exit(1) 
    })


app.use("/api/auth", authRoutes)
app.use("/api/exams", examRoutes)
app.use("/api/monitoring", monitoringRoutes)


app.options("*", cors())

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")))

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"))
    })
}

app.use((err, req, res, next) => {
    console.error("Server error:", err.stack)
    res.status(500).json({ message: "Something went wrong!", error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
