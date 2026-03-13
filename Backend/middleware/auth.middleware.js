const jwt = require('jsonwebtoken');
const BlackListModel = require('../model/blackList.model');


async function authUser(req,res,next){
    const token = req.cookies.token;

    if (!token){
        return res.status(401).json({
            message:"Token not provided"
        })
    }
    
    const isTokenBlackListed = await BlackListModel.findOne({token});

    if (isTokenBlackListed){
        return res.status(401).json({
            message:"Token is invalid."
        })
    }


    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message:"Unauthorized"
        })
    }
}
module.exports = {authUser}