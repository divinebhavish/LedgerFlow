const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [ true, "Email is required for a user" ],
        unique: [ true, "Already Exists" ],
        trim: true,
        lowercase: true,
        match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, ]   
    },

    name: {
        type: String,
        required: [ true, "Name is required for a user" ],
    },

    password: {
        type: String,
        required: [true, "Passsword is requiredf ro creating an account"],
        minLen: [6, "Password should be minimum of 6 character"],
        Select: false // Whenever we want details fo user then due to this select password will not come woth them.
    }
}, {
    timestamps: true
})

// Below function is wrotten for hashng of passwprd using bcrypt
userSchema.pre("save", async function(next) {

    if (!this.isModified("password")) {
        return
    }

    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash

    return

})

// This below function compare hashed password with password used for any operation and
// return true or false
userSchema.methods.comparePassword = async function (password) {

    return await bcrypt.compare(password, this.password)

}

const userModel = mongoose.model("user", userSchema)

module.exports = userModel