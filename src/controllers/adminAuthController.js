const Admin = require("../models/adminModule");
var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try{
        const adminData = await Admin.findOne({email: email});
        if(!adminData){
            return res.status(404).json({ status: false, message: "Admin data not found" });
        }
        //testing purpose only
        // Add password verification logic here (e.g., compare hashed passwords)
        const isMatch = await bcrypt.compare(password, adminData.password);
        if(!isMatch){
            return res.status(401).json({ status: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: adminData._id, email: adminData.email}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "1h"});
        adminData.password = undefined; // Hide password in response
        res.status(200).json({status: true, message: 'Login successful', data: {adminData, token}});
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.register = async (req, res) => {
    const { first_name, last_name, mobile_number, email, password, role } = req.body;
    try{
        const existingAdmin = await Admin.findOne({ email: email });
        if (existingAdmin) {
            return res.status(400).json({ status: false, message: "Admin with this email already exists" });
        }

        const existingMobile = await Admin.findOne({ mobile_number: mobile_number });
        if (existingMobile) {
            return res.status(400).json({ status: false, message: "Admin with this mobile number already exists" });
        }

        if(!first_name || !last_name || !mobile_number || !email || !password || !role){
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({first_name, last_name, email, mobile_number, password: hashPassword, role: 'admin'});
        const result = await newAdmin.save();

        result.password = undefined;

        res.status(201).json({status: true, message: 'Admin created Successfully.', data: result})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    } 
}