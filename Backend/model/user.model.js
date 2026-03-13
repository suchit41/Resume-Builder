const { default: mongoose } = require('mongoose');
const moongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true,'Please provide username must be unique'],
        required:[true,'Please provide username']
    },
    email:{
        type:String,
        unique:[true,'Please provide email must be unique'],
        required:[true,'Please provide email']
    },
    password:{
        type:String,
        required: true

    }

})

const UserModel = moongoose.model('User',userSchema);

module.exports = UserModel;
