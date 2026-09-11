const express = require("express")
const cookieParser = require("cookie-parser")


/**
 * - Routes
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")



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
/**
 * - User Routes
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)



module.exports = app