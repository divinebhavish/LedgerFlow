const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")




/** 
* - user register controller
* - POST /api/auth/register
*/
async function userRegisterController(req, res) {

    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with same email",
            status: "failed"
        })
    }


    const user = await userModel.create({
        email, password, name
    })

    // The below is for JWT authentication
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("jwt_token", token)

    // whenever user create new request or resource in endpoint or api the status code
    // goes is 201 
    res.status(201).json({
        user: {
            _id: user.id,
            email: user.email,
            name: user.name
        },
        token
    }) 

}

/** 
* - user login controller
* - POST /api/auth/login
*/
async function userLoginController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials",
            status: "failed"    
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message: "Invalid credentials",
            status: "failed"
        })
    } 

    // The below is for JWT authentication
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("jwt_token", token)

    // whenever user create old request or resource in endpoint or api the status code
    // goes is 200 
    res.status(200).json({
        user: {
            _id: user.id,
            email: user.email,
            name: user.name
        },
        token
    }) 
}


module.exports = {
    userRegisterController,
    userLoginController
}