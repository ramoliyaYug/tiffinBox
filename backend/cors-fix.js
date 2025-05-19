const express = require("express")
const cors = require("cors")


module.exports = function setupCors(app) {
    
    app.use(cors())

    app.options("*", cors())
}
