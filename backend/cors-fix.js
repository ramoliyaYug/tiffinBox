// This file demonstrates how to properly set up CORS if that's the issue
const express = require("express")
const cors = require("cors")

// Example of proper CORS configuration
module.exports = function setupCors(app) {
    // Option 1: Allow all origins (for development)
    app.use(cors())

    // Option 2: Configure specific origins (for production)
    /*
    app.use(cors({
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }))
    */

    // Option 3: Handle preflight requests explicitly
    app.options("*", cors())
}
