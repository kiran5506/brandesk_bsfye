const Customer = require("../models/customerModel");

// Get all customers
exports.list = async (req, res) => {
    try {
        const customerList = await Customer.find(
            {}, 
            '_id name mobile_number email type isActive'
        ).sort({ createdAt: -1 });
        
        res.status(200).json({
            status: true,
            data: customerList
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};

// Get customer by ID
exports.view = async (req, res) => {
    const { id } = req.params;
    
    try {
        const customerData = await Customer.findOne(
            { _id: id }, 
            '-password -otp_code -__v'
        );
        
        if (!customerData) {
            return res.status(404).json({ 
                status: false, 
                message: "Customer data not found" 
            });
        }
        
        res.status(200).json({
            status: true,
            data: customerData
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};

// Update customer
exports.edit = async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, email } = req.body;
    
    try {
        const customerData = await Customer.findOne({ _id: id });
        
        if (!customerData) {
            return res.status(404).json({ 
                status: false, 
                message: "Customer data not found" 
            });
        }

        // Check if email or mobile_number is being changed and if it already exists
        if (email && email !== customerData.email) {
            const existingEmail = await Customer.findOne({ email, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Email already exists" 
                });
            }
        }

        if (mobile_number && mobile_number !== customerData.mobile_number) {
            const existingMobile = await Customer.findOne({ mobile_number, _id: { $ne: id } });
            if (existingMobile) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Mobile number already exists" 
                });
            }
        }

        // Prepare update object
        const updateData = {};
        if (name) updateData.name = name;
        if (mobile_number) updateData.mobile_number = mobile_number;
        if (email) updateData.email = email;

        const result = await Customer.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password -otp_code -__v');
        
        res.status(200).json({
            status: true,
            message: 'Profile updated successfully',
            data: result
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};

// Delete customer
exports.delete = async (req, res) => {
    const { id } = req.params;
    
    try {
        const customerData = await Customer.findOne({ _id: id });
        
        if (!customerData) {
            return res.status(404).json({ 
                status: false, 
                message: "Customer data not found" 
            });
        }
        
        await Customer.findByIdAndDelete(id);
        
        res.status(200).json({
            status: true,
            message: 'Customer deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};

// Toggle customer active status
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    
    try {
        const customerData = await Customer.findOne({ _id: id });
        
        if (!customerData) {
            return res.status(404).json({ 
                status: false, 
                message: "Customer data not found" 
            });
        }
        
        const result = await Customer.findByIdAndUpdate(
            id,
            { isActive: !customerData.isActive },
            { new: true, runValidators: true }
        ).select('-password -otp_code -__v');
        
        res.status(200).json({
            status: true,
            message: `Customer ${result.isActive ? 'activated' : 'deactivated'} successfully`,
            data: result
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};

// Get customers by type
exports.listByType = async (req, res) => {
    const { type } = req.params;
    
    try {
        if (!['direct', 'enquiry'].includes(type)) {
            return res.status(400).json({ 
                status: false, 
                message: "Invalid type. Must be 'direct' or 'enquiry'" 
            });
        }

        const customerList = await Customer.find(
            { type }, 
            '-password -otp_code -__v'
        ).sort({ createdAt: -1 });
        
        res.status(200).json({
            status: true,
            data: customerList
        });
    } catch (err) {
        res.status(500).json({ 
            status: false, 
            message: `An error occurred: ${err.message}` 
        });
    }
};
