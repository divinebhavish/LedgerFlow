const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")




async function authMiddleware(req, res, next) {
    const token = req.cookies.jwt_token

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access",
            status: "failed"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        req.user = user

        next()

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access",
            status: "failed"
        })
    }
}


async function authSystemUserMiddleware(req, res, next) {

    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[ 1 ]
    
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        }) 
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if (!user.systemUser) {
            return res.status(404).json({
                message: "Frobidden access, User not found"
            })
        }

        req.user = user

        next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token"
        })
    }

} 


module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}