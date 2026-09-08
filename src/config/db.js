const mongoose = require("mongoose")


function connectToDB(){

    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connected to the DB")
    })

    .catch(err=>{
        console.log("DB connection failed")
        process.exit(1)
    })

}


module.exports = connectToDB