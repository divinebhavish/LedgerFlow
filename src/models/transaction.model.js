const mongoose = require("mongoose")



const transactionScema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Transaction must have a source account"],
        index: true
    },

    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Transaction must have a destination account"],
        index: true
    },

    status: {
        type: String,
        enum: {
            values: ["Pending", "Completed", "Failed", "Reversed"],
            message: "Status can be either Pending, Completed, Faled or Reversed"
        },
        default: "Pending"
    },

    amount: {
        type: Number,
        required: [true, "Transaction must have an amount"],
        min: [0, "Transaction Amount can not be zero"]
    },
    
    idempotencyKey: {
        type: String,
        required: [true, "Transaction must have an idempotency key"],
        unique: true,
        index: true
    }

}, {
    timestamps: true
})

const transactionModel = mongoose.model("Transaction", transactionScema)

module.exports = transactionModel