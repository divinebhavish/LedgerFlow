const express = require("express")
const accountController = require("../controllers/account.controller")
const authMiddleware = require("../middleware/auth.middleware")





const router = express.Router()




/**
 * - POST /api/accounts
 * - Create a new account
 * - Protected Route
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)


/**
 * - GET /api/accounts
 * - Get all accounts
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountController)


/**
 * - GET /api/accounts/:accountId
 * - Get account by id
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)



module.exports = router