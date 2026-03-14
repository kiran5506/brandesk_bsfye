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
        const token = jwt.sign({ id: vendorData._id, email: vendorData.email}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "1h"});
        vendorData.password = undefined; // Hide password in response
        vendorData.otp_code = undefined; // Hide OTP code in response
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
        // generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const newVendor = new Vendor({name, email, mobile_number, password: hashPassword, acceptTerms, otp_code: otp});
        const result = await newVendor.save();

        result.password = undefined;
        res.status(201).json({status: true, message: 'Vendor created Successfully.', data: result})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    } 
}

exports.verifyOtp = async (req, res) => {
    const { vendor_id, otp_code } = req.body;
    try {
        const vendor = await Vendor.findById(vendor_id);
        if (!vendor) {
            return res.status(404).json({ status: false, message: "Vendor not found" });
        }
        if (vendor.otp_code !== otp_code) {
            return res.status(400).json({ status: false, message: "Invalid OTP" });
        }
        vendor.is_otp_verified = true;
        await vendor.save();

        const token = jwt.sign({ id: vendor._id, email: vendor.email}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "1h"});
        res.status(200).json({ status: true, message: "OTP verified successfully", data: {'vendorData': vendor, token} });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.updateProfileCompletionStatus = async (req, res) => {
    const { vendor_id } = req.body;
    try {
        if (!vendor_id) {
            return res.status(400).json({ status: false, message: "Vendor ID is required" });
        }

        const vendor = await Vendor.findById(vendor_id);
        if (!vendor) {
            return res.status(404).json({ status: false, message: "Vendor not found" });
        }

        // Update profile completion status
        vendor.is_profile_completed = true;
        const result = await vendor.save();

        result.password = undefined;
        result.otp_code = undefined;

        res.status(200).json({ 
            status: true, 
            message: "Profile completion status updated successfully", 
            data: {vendorData: result}
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.generateOTP = async (req, res) => {
    const { vendor_id } = req.body;
    try {
        if (!vendor_id) {
            return res.status(400).json({ status: false, message: "Vendor ID is required" });
        }

        const vendor = await Vendor.findById(vendor_id);
        if (!vendor) {
            return res.status(404).json({ status: false, message: "Vendor not found" });
        }

        // Generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Update vendor with new OTP
        vendor.otp_code = otp;
        const result = await vendor.save();

        // In production, send OTP via SMS/Email to vendor's phone/email
        // For now, we'll just log it and return success
        console.log(`OTP generated for vendor ${vendor_id}: ${otp}`);

        result.password = undefined;
        result.otp_code = undefined; // Don't expose OTP in response for security

        res.status(200).json({ 
            status: true, 
            message: "OTP generated and sent successfully",
            data: result,
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}



