const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")


/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * - Validate Request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if ( !fromAccount || !toAccount || !amount || !idempotencyKey ) {
        return res.status(400).json({
            message: "Missing required fields",
        })
    } 

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })
    
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if ( !fromUserAccount || !toUserAccount ) {
        return res.status(400).json({
            message: "Invalid account details"
        })
    }


    /**
     * - Validate Idempotency Key - To check that 1 payment do not occurr multiple time 
     * - So below are some conditions to check
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })


    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status == "Completed") {
            return res.status(200).json({
                message: "Transaction already completed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status == "Failed") {
            return res.status(200).json({
                message: "Transaction failed, Try again",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status == "Pending") {
            return res.status(200).json({
                message: "Transaction pending, Please wait",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status == "Reversed") {
            return res.status(200).json({
                message: "Transaction was reversed, Try again",
                transaction: isTransactionAlreadyExists
            })
        } 
    }

    /**
     * - Check Account Status
     */
    if (fromUserAccount.status !== "Active" || toUserAccount.status !== "Active") {
        return res.status(400).json({
            message: "Inactive account cannot perform transactions, Because both sender and receiver account must be active"
        })
    }

    /** 
     * - Derive Seder Balance from ledger
    */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance, current balace is ${balance}`
        })
    }

    /**
     * - 5. Create Transaction (Pending)
     */
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const [ transaction ] = await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "Completed"
        } ], { session })

        await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT",
        }], { session }) 

        await (()=>{ 
            return new Promise((resolve) => setTimeout(resolve, 100 * 1000))
        })() 

        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })



        await session.commitTransaction()
        session.endSession()

        /**
         * -Email Servicce Notiffication
         */

        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            fromUserAccount._id,
            toUserAccount._id
        )

        return res.status(200).json({
            message: "Transaction completed successfully",
            transaction: transaction
        })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ message: err.message })
    }
}

async function createInitialFundsTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "Missing required fields"
        })
    }

    // Now we'll check that with this id of to account actually exists ot not.
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount details"
        })
    }

    // now from where this money come obv- SystemUser
    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })
 
    // Now if any human error from frontend then this below code can handle
    // it. because frontend dev are dumbAss.
    if(!fromUserAccount) {
        return res.status(400).json({
            message: "System User Account not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const [ transaction ] = await transactionModel.create( [ {
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "Completed"
        } ], { session })

        const debitLedgerEntry = await ledgerModel.create( [ {
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT",
        } ], { session })

        const creditLedgerEntry = await ledgerModel.create( [ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "Completed" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message: "Initial funds added successfully",
            transaction: transaction
        })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        return res.status(500).json({ message: err.message })
    }


 
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}