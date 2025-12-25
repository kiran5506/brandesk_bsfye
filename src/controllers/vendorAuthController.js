const Vendor = require("../models/vendorModule");
var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try{
        const vendorData = await Vendor.findOne({email: email});
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        // Add password verification logic here (e.g., compare hashed passwords)
        const isMatch = await bcrypt.compare(password, vendorData.password);
        if(!isMatch){
            return res.status(401).json({ status: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: Vendor._id, email: Vendor.email}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "1h"});
        vendorData.password = undefined; // Hide password in response
        res.status(200).json({status: true, message: 'Login successful', data: {vendorData, token}});
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.register = async (req, res) => {
    const { name, mobile_number, email, password, confirmPassword,  acceptTerms } = req.body;
    try{
        const existingVendor = await Vendor.findOne({ email: email });
        if (existingVendor) {
            return res.status(400).json({ status: false, message: "Vendor with this email already exists" });
        }

        const existingMobile = await Vendor.findOne({ mobile_number: mobile_number });
        if (existingMobile) {
            return res.status(400).json({ status: false, message: "Vendor with this mobile number already exists" });
        }

        if(!name || !mobile_number || !email || !password || !confirmPassword){
            return res.status(400).json({ status: false, message: "All fields are required" });
        }
        
        if(password !== confirmPassword){
            return res.status(400).json({ status: false, message: "Password and Confirm Password do not match" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newVendor = new Vendor({name, email, mobile_number, password: hashPassword, acceptTerms});
        const result = await newVendor.save();

        result.password = undefined;

        res.status(201).json({status: true, message: 'Vendor created Successfully.', data: result})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    } 
}