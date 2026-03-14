const Vendor = require("../models/vendorModule");
const baseUrl = process.env.BASE_URL;

exports.edit = async (req, res) => {    
    const { id } = req.params;
    const files = req.files;
    const { name, mobile_number, email, address } = req.body;

    try{
        let profile_image = "";

        const vendorData = await Vendor.findOne({_id: id});
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }

        if(files){
            profile_image = files.profile_image ? files.profile_image[0].filename : vendorData.profile_image;
        }else{
            profile_image = vendorData.profile_image;
        }

        const result = await Vendor.findByIdAndUpdate(id, {name, mobile_number, email, address, profile_image}, { new: true, runValidators: true });
        console.log(result);
        
        // Return data with full image path like slider controller
        const vendorResponse = {
            ...result.toObject(),
            profile_image: result.profile_image ? baseUrl + result.profile_image : ""
        };
        
        res.status(201).json({status: true, message: 'Vendor updated Successfully.', data: vendorResponse})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.updatePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    try {
        // Validate input
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ status: false, message: "All password fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: false, message: "New password and confirm password do not match" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
        }

        const vendorData = await Vendor.findOne({ _id: id });
        if (!vendorData) {
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }

        // Verify old password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(oldPassword, vendorData.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Old password is incorrect" });
        }

        // Hash new password
        const hashPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await Vendor.findByIdAndUpdate(
            id,
            { password: hashPassword },
            { new: true, runValidators: true }
        );

        result.password = undefined;
        res.status(200).json({
            status: true,
            message: 'Password updated successfully',
            data: result
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.delete = async (req, res) => {
    const { id } = req.params;
    try{
        const vendorData = await Vendor.findOne({_id: id});
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        const result = await Vendor.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(201).json({status: true, message: 'Vendor Deleted Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.list = async (req, res) => {
    try{
        const vendorList = await Vendor.find({}, '-otp_code -password -__v -is_otp_verified -is_profile_completed -is_profile_verified -isActive -createdAt -updatedAt').sort({ createdAt: -1 });
        res.status(200).json({status: true, data: vendorList});

    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.view = async (req, res) => {
    const { id } = req.params;
    try{
        const vendorData = await Vendor.findOne({_id: id}, '-password -__v');
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        
        // Add full image path like slider controller
        if(vendorData.profile_image){
            vendorData.profile_image = baseUrl + vendorData.profile_image;
        }
        
        res.status(200).json({status: true, data: vendorData});
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}