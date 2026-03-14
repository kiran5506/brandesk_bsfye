const User = require("../models/usersModel");

exports.edit = async (req, res) => {    
    const { id } = req.params;
    const { name, mobileNumber, email, dob, gender, qualification, occupationOrJob, country, state, city, pincode, address, description } = req.body;
    try{
        const userData = await User.findOne({_id: id});
        if(!userData){
            return res.status(404).json({ status: false, message: "User data not found" });
        }
        const result = await User.findByIdAndUpdate(id, { 
            name, 
            mobileNumber, 
            email, 
            dob, 
            gender, 
            qualification, 
            occupationOrJob, 
            country, 
            state, 
            city, 
            pincode, 
            address,
            description
        }, { new: true, runValidators: true });
        console.log(result);
        
        res.status(201).json({status: true, message: 'User updated Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.delete = async (req, res) => {
    const { id } = req.params;
    try{
        const userData = await User.findOne({_id: id});
        if(!userData){
            return res.status(404).json({ status: false, message: "User data not found" });
        }
        const result = await User.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(201).json({status: true, message: 'User Deleted Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.list = async (req, res) => {
    try{
        const userList = await User.find({}, '-password -__v').sort({ createdAt: -1 });
        res.status(200).json({status: true, data: userList});

    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.fetchById = async (req, res) => {
    const { id } = req.params;
    try{
        const userData = await User.findOne({_id: id}, '-password -__v');
        if(!userData){
            return res.status(404).json({ status: false, message: "User data not found" });
        }
        res.status(200).json({status: true, data: userData});
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}
