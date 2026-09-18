const mongoose = require("mongoose")


const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "token is required to Black list" ],
        unique: [ true, "Token is already Blacklisted" ]
    } 
}, {
    timestamps: true
})

tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // 3days
})

const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema)

module.exports = tokenBlacklistModel;