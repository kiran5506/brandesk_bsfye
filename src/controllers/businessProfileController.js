const BusinessProfile = require("../models/businessProfileModel");
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files || {};
    const { vendor_id, serviceName, businessName, doorNumber, area, landmark, city, state, pincode, skills, languages } = req.body;
    
    try {
        // Validate required fields
        if (!vendor_id || !serviceName || !businessName || !city || !state || !pincode) {
            return res.status(400).json({ 
                status: false, 
                message: "Required fields are missing (vendor_id, serviceName, businessName, city, state, pincode)" 
            });
        }

        // Check if business profile already exists for this vendor and service
        const existingProfile = await BusinessProfile.findOne({ 
            vendor_id, 
            serviceName 
        });
        
        if (existingProfile) {
            return res.status(400).json({ 
                status: false, 
                message: "Business profile already exists for this service" 
            });
        }

        // Handle file uploads
        let profilePicture = "";
        if (files.profilePicture) {
            profilePicture = files.profilePicture[0].filename;
        }

        let documents = {
            aadharFront: files.aadharFront ? files.aadharFront[0].filename : "",
            aadharBack: files.aadharBack ? files.aadharBack[0].filename : "",
            registrationCopy: files.registrationCopy ? files.registrationCopy[0].filename : "",
            gst: files.gst ? files.gst[0].filename : ""
        };

        // Parse skills and languages (they come as comma-separated strings or arrays)
        const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
        const languagesArray = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : []);

        const newBusinessProfile = new BusinessProfile({
            vendor_id,
            serviceName,
            businessName,
            profilePicture,
            address: {
                doorNumber,
                area,
                landmark,
                city,
                state,
                pincode
            },
            skills: skillsArray,
            languages: languagesArray,
            documents
        });
        
        const result = await newBusinessProfile.save();
        res.status(201).json({ 
            status: true, 
            message: 'Business profile created successfully.', 
            data: result 
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files || {};
    const { id } = req.params;
    const { vendor_id, serviceName, businessName, doorNumber, area, landmark, city, state, pincode, skills, languages } = req.body;
    
    try {
        const businessProfile = await BusinessProfile.findOne({ _id: id });
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        // Verify vendor ownership
        if (businessProfile.vendor_id.toString() !== vendor_id) {
            return res.status(403).json({ status: false, message: "Unauthorized access" });
        }

        // Handle file uploads
        let profilePicture = businessProfile.profilePicture;
        if (files.profilePicture) {
            profilePicture = files.profilePicture[0].filename;
        }

        let documents = { ...businessProfile.documents };
        if (files.aadharFront) documents.aadharFront = files.aadharFront[0].filename;
        if (files.aadharBack) documents.aadharBack = files.aadharBack[0].filename;
        if (files.registrationCopy) documents.registrationCopy = files.registrationCopy[0].filename;
        if (files.gst) documents.gst = files.gst[0].filename;

        // Parse skills and languages
        const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : businessProfile.skills);
        const languagesArray = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : businessProfile.languages);

        const result = await BusinessProfile.findByIdAndUpdate(
            id,
            {
                serviceName,
                businessName,
                profilePicture,
                address: {
                    doorNumber,
                    area,
                    landmark,
                    city,
                    state,
                    pincode
                },
                skills: skillsArray,
                languages: languagesArray,
                documents,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            status: true, 
            message: 'Business profile updated successfully.', 
            data: result 
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    const { vendor_id } = req.body;
    
    try {
        const businessProfile = await BusinessProfile.findOne({ _id: id });
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        // Verify vendor ownership
        if (businessProfile.vendor_id.toString() !== vendor_id) {
            return res.status(403).json({ status: false, message: "Unauthorized access" });
        }

        await BusinessProfile.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Business profile deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const businessProfiles = await BusinessProfile.find().populate('vendor_id', 'name email mobile_number');
        if (!businessProfiles || businessProfiles.length === 0) {
            return res.status(404).json({ status: false, message: "No business profiles found" });
        }

        const profilesList = businessProfiles.map(profile => {
            return {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                serviceName: profile.serviceName,
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : "",
                address: profile.address,
                skills: profile.skills,
                languages: profile.languages,
                documents: {
                    aadharFront: profile.documents.aadharFront ? baseUrl + profile.documents.aadharFront : "",
                    aadharBack: profile.documents.aadharBack ? baseUrl + profile.documents.aadharBack : "",
                    registrationCopy: profile.documents.registrationCopy ? baseUrl + profile.documents.registrationCopy : "",
                    gst: profile.documents.gst ? baseUrl + profile.documents.gst : ""
                },
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            };
        });

        res.status(200).json({ 
            status: true, 
            message: 'Business profiles list.', 
            data: profilesList 
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const businessProfile = await BusinessProfile.findById(id).populate('vendor_id', 'name email mobile_number');
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        const response = {
            _id: businessProfile._id,
            vendor_id: businessProfile.vendor_id,
            serviceName: businessProfile.serviceName,
            businessName: businessProfile.businessName,
            profilePicture: businessProfile.profilePicture ? baseUrl + businessProfile.profilePicture : "",
            address: businessProfile.address,
            skills: businessProfile.skills,
            languages: businessProfile.languages,
            documents: {
                aadharFront: businessProfile.documents.aadharFront ? baseUrl + businessProfile.documents.aadharFront : "",
                aadharBack: businessProfile.documents.aadharBack ? baseUrl + businessProfile.documents.aadharBack : "",
                registrationCopy: businessProfile.documents.registrationCopy ? baseUrl + businessProfile.documents.registrationCopy : "",
                gst: businessProfile.documents.gst ? baseUrl + businessProfile.documents.gst : ""
            },
            isActive: businessProfile.isActive,
            createdAt: businessProfile.createdAt,
            updatedAt: businessProfile.updatedAt
        };

        res.status(200).json({ 
            status: true, 
            message: 'Business profile data', 
            data: response 
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByVendorId = async (req, res) => {
    const { vendor_id } = req.params;
    
    try {
        const businessProfiles = await BusinessProfile.find({ vendor_id }).populate('vendor_id', 'name email mobile_number');
        if (!businessProfiles || businessProfiles.length === 0) {
            return res.status(404).json({ status: false, message: "No business profiles found for this vendor" });
        }

        const profilesList = businessProfiles.map(profile => {
            return {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                serviceName: profile.serviceName,
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : "",
                address: profile.address,
                skills: profile.skills,
                languages: profile.languages,
                documents: {
                    aadharFront: profile.documents.aadharFront ? baseUrl + profile.documents.aadharFront : "",
                    aadharBack: profile.documents.aadharBack ? baseUrl + profile.documents.aadharBack : "",
                    registrationCopy: profile.documents.registrationCopy ? baseUrl + profile.documents.registrationCopy : "",
                    gst: profile.documents.gst ? baseUrl + profile.documents.gst : ""
                },
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            };
        });

        res.status(200).json({ 
            status: true, 
            message: 'Business profiles by vendor.', 
            data: profilesList 
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
