const Admin = require("../models/adminModule");
var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const baseUrl = process.env.BASE_URL;

const sanitizeAdmin = (adminDoc) => {
    if (!adminDoc) return null;
    const admin = adminDoc.toObject ? adminDoc.toObject() : { ...adminDoc };
    delete admin.password;
    return admin;
};

const formatAdminResponse = (adminDoc) => {
    const admin = sanitizeAdmin(adminDoc);
    if (!admin) return admin;
    if (admin.profile_image && baseUrl && !String(admin.profile_image).startsWith('http')) {
        admin.profile_image = `${baseUrl}${admin.profile_image}`;
    }
    return admin;
};

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
    res.status(200).json({status: true, message: 'Login successful', data: {adminData: formatAdminResponse(adminData), token}});
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

        if(!first_name || !mobile_number || !email || !password || !role){
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({first_name, last_name: last_name || '', email, mobile_number, password: hashPassword, role: 'admin'});
        const result = await newAdmin.save();

    res.status(201).json({status: true, message: 'Admin created Successfully.', data: formatAdminResponse(result)})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    } 
}

exports.getProfile = async (req, res) => {
    try {
        const adminId = req.user?.id;

        if (!adminId) {
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }

        const adminData = await Admin.findById(adminId);
        if (!adminData) {
            return res.status(404).json({ status: false, message: "Admin data not found" });
        }

        return res.status(200).json({
            status: true,
            message: "Admin profile fetched successfully",
            data: formatAdminResponse(adminData)
        });
    } catch (err) {
        return res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.updateProfile = async (req, res) => {
    const { first_name, last_name, mobile_number, email } = req.body;
    const files = req.files;

    try {
        const adminId = req.user?.id;

        if (!adminId) {
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }

        if (!first_name || !mobile_number || !email) {
            return res.status(400).json({ status: false, message: "First name, mobile number and email are required" });
        }

        const adminData = await Admin.findById(adminId);
        if (!adminData) {
            return res.status(404).json({ status: false, message: "Admin data not found" });
        }

        const existingEmail = await Admin.findOne({ email, _id: { $ne: adminId } });
        if (existingEmail) {
            return res.status(400).json({ status: false, message: "Admin with this email already exists" });
        }

        const existingMobile = await Admin.findOne({ mobile_number, _id: { $ne: adminId } });
        if (existingMobile) {
            return res.status(400).json({ status: false, message: "Admin with this mobile number already exists" });
        }

        const profile_image = files?.profile_image?.[0]?.key || adminData.profile_image;

        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { first_name, last_name: last_name || '', mobile_number, email, profile_image },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            status: true,
            message: "Admin profile updated successfully",
            data: formatAdminResponse(updatedAdmin)
        });
    } catch (err) {
        return res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    try {
        const adminId = req.user?.id;

        if (!adminId) {
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ status: false, message: "All password fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: false, message: "New password and confirm password do not match" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
        }

        const adminData = await Admin.findById(adminId);
        if (!adminData) {
            return res.status(404).json({ status: false, message: "Admin data not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, adminData.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Old password is incorrect" });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await Admin.findByIdAndUpdate(
            adminId,
            { password: hashPassword },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            status: true,
            message: "Password updated successfully"
        });
    } catch (err) {
        return res.status(500).send(`An error occurred: ${err.message}`);
    }
};