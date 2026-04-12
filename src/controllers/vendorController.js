const Vendor = require("../models/vendorModule");
const BusinessProfile = require("../models/businessProfileModel");
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
        const vendorList = await Vendor.find({}, '_id name mobile_number email').sort({ createdAt: -1 });
        res.status(200).json({status: true, data: vendorList});

    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.approveOrReject = async (req, res) => {
    const { id } = req.params;
    const { profile_status } = req.body;

    try {
        if (!profile_status || !['accepted', 'rejected'].includes(profile_status)) {
            return res.status(400).json({
                status: false,
                message: "profile_status must be 'accepted' or 'rejected'"
            });
        }

        const vendorData = await Vendor.findOne({ _id: id });
        if (!vendorData) {
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }

        const now = new Date();
        const updatePayload = {
            profile_status,
            is_profile_verified: true,
            approved_date: profile_status === 'accepted' ? now : null,
            rejected_date: profile_status === 'rejected' ? now : null
        };

        const updateOptions = { new: true, runValidators: true };
        let updatedVendor;

        if (profile_status === 'accepted') {
            updatedVendor = await Vendor.findByIdAndUpdate(
                id,
                { ...updatePayload, $inc: { credits: 10 } },
                updateOptions
            );
        } else {
            updatedVendor = await Vendor.findByIdAndUpdate(id, updatePayload, updateOptions);
        }

        res.status(200).json({
            status: true,
            message: `Vendor ${profile_status} successfully.`,
            data: updatedVendor
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.listWithStatus = async (req, res) => {
    try {
        const { profile_status } = req.query;
        const filter = {};

        if (profile_status) {
            filter.profile_status = profile_status;
        }

    const vendors = await Vendor.find(filter, '_id name mobile_number email profile_image profile_status is_profile_verified is_profile_completed is_otp_verified isActive approved_date rejected_date createdAt')
            .sort({ createdAt: -1 });

        if (!vendors || vendors.length === 0) {
            return res.status(404).json({ status: false, message: "No vendors found" });
        }

        const vendorIds = vendors.map((vendor) => vendor._id);
        const businessProfiles = await BusinessProfile.find({ vendor_id: { $in: vendorIds } })
            .populate('service_id', 'serviceName serviceType');

        const profilesByVendor = businessProfiles.reduce((acc, profile) => {
            const vendorId = profile.vendor_id.toString();
            if (!acc[vendorId]) {
                acc[vendorId] = [];
            }

            acc[vendorId].push({
                _id: profile._id,
                vendor_id: profile.vendor_id,
                service_id: profile.service_id,
                serviceName: profile.service_id?.serviceName || "",
                serviceType: profile.service_id?.serviceType || "",
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : "",
                address: profile.address,
                skills: profile.skills,
                languages: profile.languages,
                documents: {
                    aadharFront: profile.documents?.aadharFront ? baseUrl + profile.documents.aadharFront : "",
                    aadharBack: profile.documents?.aadharBack ? baseUrl + profile.documents.aadharBack : "",
                    registrationCopy: profile.documents?.registrationCopy ? baseUrl + profile.documents.registrationCopy : "",
                    gst: profile.documents?.gst ? baseUrl + profile.documents.gst : ""
                },
                about_us: profile.about_us || "",
                communication_address: profile.communication_address || "",
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            });

            return acc;
        }, {});

        const response = vendors.map((vendor) => {
            const vendorId = vendor._id.toString();
            return {
                _id: vendor._id,
                name: vendor.name,
                mobile_number: vendor.mobile_number,
                email: vendor.email,
                profile_image: vendor.profile_image ? baseUrl + vendor.profile_image : "",
                status: vendor.profile_status,
                is_profile_verified: vendor.is_profile_verified,
                is_profile_completed: vendor.is_profile_completed,
                is_otp_verified: vendor.is_otp_verified,
                isActive: vendor.isActive,
                approved_date: vendor.approved_date || null,
                rejected_date: vendor.rejected_date || null,
                createdAt: vendor.createdAt,
                business_profiles: profilesByVendor[vendorId] || []
            };
        });

        res.status(200).json({ status: true, message: 'Vendors with status and business profiles.', data: response });
    } catch (err) {
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