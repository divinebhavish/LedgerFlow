const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authMiddleware(req, res, next) {
    const token = req.cookies.jwt_token

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access",
            status: "failed"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Session expired, please login again",
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

    const isBlacklisted = await tokenBlacklistModel.findOne({ jwt_token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Session expired, please login again"
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