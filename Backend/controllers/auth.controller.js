const usemodel = require('../models/user.model')
const bcrypt = require('bcryptjs');
const e = require('express');
const jwt = require('jsonwebtoken')


/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */


async function registerUserController(req,res){

    const {username, email,password} = req.body;

    if (!username || !email || !password){
        return res.status(400).json({
            message:"Please provide username, email and password"
        })
    }

    const existingUser = await usemodel.findOne({$or:[{username},{email}]})

    if (existingUser){
        return res.status(400).json({
            message:"Username or email already exists"
        })
    }

    const hash = await bcrypt.hash(password,10)

    const user = await usemodel.create({
        username,
        email,
        password:hash
    })

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
        expiresIn:'1d'
    })

    res.cookie('token',token)


    res.status(201).json({
        message:"User register successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
    
}

/**
 * @name loginUserController
 * @description create a new user in database
 * @access public
 */


async function loginUserController(req,res){
    const {email, password} = req.body;

    if (!email || !password){
        return res.status(400).json({
            message:"Please provide email and password"
        })
    }

    const user = await usemodel.findOne({email})
    
    if (!user){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
        expiresIn:'1d'
    })

    res.cookie('token',token)


    res.status(200).json({
        message:"User logged in successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
    
} 

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */


async function logOutUserController ( req,res){
    const {token} = req.cookies;

    if (token){
        await BlacklistModel.create({token})
    }

    res.clearCookie('token')
    return res.status(200).json({
            message:"User logged out successfully"
    })

}


/**
 * @name getMeController
 * @description get the current logged-in user's information
 * @access public
 */

async function getMeController(req,res){
    const user = await usemodel.findById(req.user.id).select('-password')

    if (!user){
        return res.status(404).json({
            message:"User not found"
        })
    }

    res.status(200).json({
        message:"User fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}   



export default{
    loginUserController,
    registerUserController,
    logOutUserController,
    getMeController
}