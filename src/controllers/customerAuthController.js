const Customer = require("../models/customerModel");
var jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require("../utils/mail");

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try{
        const customerData = await Customer.findOne({email: email});
        if(!customerData){
            return res.status(404).json({ status: false, message: "Customer not found" });
        }

        if(!customerData.isActive){
            return res.status(403).json({ status: false, message: "Your account is inactive. Please contact support." });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, customerData.password);
        if(!isMatch){
            return res.status(401).json({ status: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: customerData._id, email: customerData.email, role: 'customer'}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "7d"});
        
        customerData.password = undefined; // Hide password in response
        customerData.otp_code = undefined; // Hide OTP in response
        
        res.status(200).json({status: true, message: 'Login successful', data: {customerData, token}});
    }catch(err){
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

exports.register = async (req, res) => {
    const { name, mobile_number, email, password, confirmPassword, type } = req.body;
    try{
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ 
            $or: [{ email: email }, { mobile_number: mobile_number }] 
        });
        
        if (existingCustomer) {
            if(existingCustomer.email === email){
                return res.status(400).json({ status: false, message: "Customer with this email already exists" });
            }
            if(existingCustomer.mobile_number === mobile_number){
                return res.status(400).json({ status: false, message: "Customer with this mobile number already exists" });
            }
        }

        // Validate required fields
        if(!name || !mobile_number || !email || !password || !confirmPassword){
            return res.status(400).json({ status: false, message: "All fields are required" });
        }
        
        // Check if passwords match
        if(password !== confirmPassword){
            return res.status(400).json({ status: false, message: "Password and Confirm Password do not match" });
        }

        // Validate password length
        if(password.length < 6){
            return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);
        
        // Create new customer
        const newCustomer = new Customer({
            name, 
            email, 
            mobile_number, 
            password: hashPassword,
            type: type || 'direct',
            isActive: false
        });
        
        const result = await newCustomer.save();

        // Generate 4 digit OTP for verification
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        result.otp_code = otp;

         // TODO: Send OTP via email or SMS
        const to = email;
        const subject = 'OTP for Customer Registration';
        const text = 'This OTP is for Customer registration';
        const html = `<p>This OTP is for Customer registration</p><h2>${otp}</h2>`;
        const response = await sendEmail(to, subject, text, html);

        await result.save();

        // Hide sensitive data
        result.password = undefined;
        result.is_otp_verified = undefined;
        result.otp_code = undefined;
        result.createdAt = undefined;
        result.updatedAt = undefined;
        result.isActive = undefined;
        result.type = undefined;

       
        // For now, we'll include it in the response (remove in production)
        
        res.status(201).json({
            status: true, 
            message: 'Customer registered successfully. Please verify OTP.', 
            data: {
                customer: result,
                otp: otp // Remove this in production
            }
        });
    }catch(err){
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    } 
}

exports.verifyOtp = async (req, res) => {
    const { customer_id, otp_code } = req.body;
    try {
        const customer = await Customer.findById(customer_id);
        
        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }
        
        if (customer.otp_code !== otp_code) {
            return res.status(400).json({ status: false, message: "Invalid OTP" });
        }
        
        customer.is_otp_verified = true;
        customer.isActive = true;
        customer.otp_code = undefined;
        await customer.save();

        const token = jwt.sign({ id: customer._id, email: customer.email, role: 'customer'}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "7d"});
        
        customer.password = undefined;
        
        res.status(200).json({ 
            status: true, 
            message: "OTP verified successfully", 
            data: {customerData: customer, token} 
        });
    } catch (err) {
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

exports.resendOtp = async (req, res) => {
    const { customer_id, purpose } = req.body;
    const otpPurpose = (purpose || 'register').toString().toLowerCase();
    try {
        const customer = await Customer.findById(customer_id);
        
        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }

        if (otpPurpose === 'register' && customer.is_otp_verified) {
            return res.status(400).json({ status: false, message: "Customer is already verified" });
        }

        // Generate new 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        customer.otp_code = otp;
        if (otpPurpose === 'forgot') {
            customer.password_reset_verified = false;
        }
        await customer.save();

        const to = customer.email;
        const subject = otpPurpose === 'forgot' ? 'OTP for Password Reset' : 'OTP for Customer Registration';
        const text = otpPurpose === 'forgot'
            ? 'This OTP is for your password reset request.'
            : 'This OTP is for customer registration verification.';
        const html = otpPurpose === 'forgot'
            ? `<p>This OTP is for your password reset request</p><h2>${otp}</h2>`
            : `<p>This OTP is for Customer registration</p><h2>${otp}</h2>`;
        await sendEmail(to, subject, text, html);
        
        res.status(200).json({ 
            status: true, 
            message: "OTP resent successfully",
            data: {
                customer_id: customer._id,
                email: customer.email,
                mobile_number: customer.mobile_number,
                otp: otp
            } // Remove otp in production
        });
    } catch (err) {
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ status: false, message: "Email is required" });
        }

        const customer = await Customer.findOne({ email: email });
        
        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }

        // Generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        customer.otp_code = otp;
        customer.password_reset_verified = false;
        await customer.save();

        const to = email;
        const subject = 'OTP for Password Reset';
        const text = 'This OTP is for your password reset request';
        const html = `<p>This OTP is for your password reset request</p><h2>${otp}</h2>`;
        await sendEmail(to, subject, text, html);
        
        res.status(200).json({ 
            status: true, 
            message: "Password reset OTP sent successfully",
            data: { 
                customer_id: customer._id,
                email: customer.email,
                mobile_number: customer.mobile_number,
                otp: otp // Remove this in production
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

exports.verifyForgotPasswordOtp = async (req, res) => {
    const { customer_id, otp_code } = req.body;
    try {
        if (!customer_id || !otp_code) {
            return res.status(400).json({ status: false, message: "customer_id and otp_code are required" });
        }

        const customer = await Customer.findById(customer_id);

        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }

        if (customer.otp_code !== otp_code) {
            return res.status(400).json({ status: false, message: "Invalid OTP" });
        }

        customer.password_reset_verified = true;
        customer.otp_code = undefined;
        await customer.save();

        res.status(200).json({
            status: true,
            message: "Forgot password OTP verified successfully",
            data: {
                customer_id: customer._id,
                email: customer.email
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

exports.resetPassword = async (req, res) => {
    const { customer_id, new_password, confirm_password } = req.body;
    try {
        if (!customer_id || !new_password || !confirm_password) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        const customer = await Customer.findById(customer_id);
        
        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }

        if (!customer.password_reset_verified) {
            return res.status(400).json({ status: false, message: "OTP verification required before resetting password" });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ status: false, message: "Passwords do not match" });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
        }

        // Hash new password
        const hashPassword = await bcrypt.hash(new_password, 10);
        customer.password = hashPassword;
        customer.otp_code = undefined;
    customer.password_reset_verified = false;
        await customer.save();

        res.status(200).json({ 
            status: true, 
            message: "Password reset successfully" 
        });
    } catch (err) {
        res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
    }
}

// Change Password (for authenticated users)
exports.changePassword = async (req, res) => {
    const { customer_id, old_password, new_password, confirm_password } = req.body;
    
    try {
        // Validate required fields
        if (!customer_id || !old_password || !new_password || !confirm_password) {
            return res.status(400).json({ 
                status: false, 
                message: "All fields are required" 
            });
        }

        const customer = await Customer.findById(customer_id);
        
        if (!customer) {
            return res.status(404).json({ 
                status: false, 
                message: "Customer not found" 
            });
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(old_password, customer.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                status: false, 
                message: "Old password is incorrect" 
            });
        }

        // Check if new passwords match
        if (new_password !== confirm_password) {
            return res.status(400).json({ 
                status: false, 
                message: "New password and confirm password do not match" 
            });
        }

        // Validate new password length
        if (new_password.length < 6) {
            return res.status(400).json({ 
                status: false, 
                message: "New password must be at least 6 characters long" 
            });
        }

        // Check if new password is different from old password
        const isSameAsOld = await bcrypt.compare(new_password, customer.password);
        if (isSameAsOld) {
            return res.status(400).json({ 
                status: false, 
                message: "New password must be different from old password" 
            });
        }

        // Hash new password
        const hashPassword = await bcrypt.hash(new_password, 10);
        customer.password = hashPassword;
        await customer.save();

        res.status(200).json({ 
            status: true, 
            message: "Password changed successfully" 
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
}
