const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [ true, "Account must be associated with the user" ],
        index: true
    },

    status: {
        type: String,
        enum: {
            values: ["Active", "Frozen", "Closed"],
            message: "Status can be either Active, Frozen or Closed",  
        },
        default: "Active"
    },

    currency: {
        type: String,
        required: [true, "Please provide currency for the account"],
        default: "INR"
    }
}, {
    timestamps: true
})


accountSchema.index({ user: 1, status: 1 })

// accountSchema.methods.getBalance = async function(){}

accountSchema.methods.getBalance = async function () {
    
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: { 
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: {
                            if: { $eq: [ "$type", "DEBIT" ] },
                            then: "$amount",
                            else: 0
                        }
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: {
                            if: { $eq: [ "$type", "CREDIT" ] },
                            then: "$amount",
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $project:{
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            } 
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[0].balance

}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel