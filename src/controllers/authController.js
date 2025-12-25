const { signupSchema } = require('../middlewares/validator');
const User = require('../models/usersModel'); 
const bcrypt = require('bcryptjs');  
var jwt = require('jsonwebtoken');
const moment = require('moment');

const baseUrl = process.env.BASE_URL;

exports.singUp = async (req, res) => {
    const {email, password, name, role, plan, refCode, mobileNumber} = req.body;
    try{
        const {error, value} = signupSchema.validate({email, password});
        if(error){
            return res.status(401).json({success: false, message: error.details[0].message})
        }

        const user = await User.findOne({email});
        if(user){
            return res.status(401).json({success:false, message: 'Email Already exist'});
        }

        const hashPassword = await bcrypt.hash(password, 10);
        let userObject = {};
        if(role == 'admin'){
            userObject = {email, password: hashPassword, name, role};
        }else{
            const userid= await generateUserId();
            const planIds = [];
            planIds.push(plan);
            userObject = {email, password: hashPassword, name, role, plans: planIds, currentPlan: plan, refCode, mobileNumber, userid: userid, profile: user?.profile};
        }
        const newUser = new User(userObject)
        //console.log(newUser);
        const result = await newUser.save();

        console.log('result', result);
        result.password = undefined;
        res.status(201).json({status: true, message: 'User Registerd Successfully.', data: result})
    }catch(error){
        console.log(`Error: ${error}`);
    }
}

exports.logIn = async (req, res) => {
    const {email, password, role} = req.body;  
    try{
        const {error, value} = signupSchema.validate({email, password});
        if(error){
            return res.status(209).json({success: false, message: error.details[0].message})
        }
        var user;
        if(role === 'user'){
            user = await User.findOne({email, role}).select('+password').populate('currentPlan', 'name price');
        }else{
            user = await User.findOne({email, role}).select('+password');
        }
        
        if(!user){
            return res.status(209).json({success:false, message: 'Email Not exist'});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            res.status(209).json({status: false, message: 'Invalid Password'});
        }

        if(role === 'user' && user.isPaymentdone === false){
            res.status(209).json({status: false, message: 'Payment Not done', data: {userid:user._id, currentPlan: user?.currentPlan}});
        }
        const token = jwt.sign({ id: user._id, email: user.email}, 
            process.env.JWT_SECRET, 
            {expiresIn: "1h"});
            console.log('token', token);
            
        //8*3600000 - 8 hours
        // res.cookie('Authorization', 'Bearer '+ token, {expires: new Date(Date.now() + 1*3600000), httpOnly: process.env.NODE_ENV === 'production', secure: process.env.NODE_ENV==='production'}).json({
        //     success:true,
        //     token,
        //     message:'Login Success'
        // })
        let profileImg = user?.profile ? baseUrl + user.profile : "";
        let userObject = {email, name: user.name, profile: profileImg, plans: user?.plans, currentPlan: user?.currentPlan}
        res.status(200).json({status: true, message:'Login Success', data: {userid:user._id, token, role, details: userObject}});
    }catch(error){
        console.log(`Error: ${error}`);
    }
}

exports.signOut = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({status: true, message: 'Logged out successfully.'})
}

exports.generateToken = (req, res) => {
    const user = req.body;
    const payload = {
        grant_type: user.grant_type,
        username: user.username,
        password: user.password
    };  
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({status: true, message:'Login Success', data: { token }});
}