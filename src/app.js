const express = require("express")
const cookieParser = require("cookie-parser")

const authRouter = require("./routes/auth.routes")



// This below is one from two work of app.js "Start of server"
const app = express()

// And the 2nd work is two config server liek what are the middleware and api you 
// are using

// Now with the help of this middleware express can read data of req.body
// wothout express is not capable to do such
app.use(express.json())

app.use(cookieParser())

// whichever endpoints hit by "/api/auth" like who ever the user hits the server all
// thos requests will be redirect to authRouter
app.use("/api/auth", authRouter)



module.exports = app;