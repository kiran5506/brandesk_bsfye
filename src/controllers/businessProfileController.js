const BusinessProfile = require("../models/businessProfileModel");
const BusinessPortfolio = require("../models/businessPortfolioModel");
const BusinessPackage = require("../models/businessPackageModel");
const Event = require("../models/eventModel");
const Vendor = require("../models/vendorModule");
const baseUrl = process.env.BASE_URL;

const mapFileUrls = (files = []) => files.map((file) => baseUrl + file);

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files || {};
    const {
    vendor_id,
    service_id,
    serviceName,
        businessName,
        doorNumber,
        area,
        landmark,
        city,
        state,
        pincode,
        skills,
        languages,
        about_us,
        communication_address
    } = req.body;
    
    try {
        // Validate required fields
        const resolvedServiceId = service_id || serviceName;

        if (!vendor_id || !resolvedServiceId || !businessName || !city || !state || !pincode) {
            return res.status(400).json({ 
                status: false, 
                message: "Required fields are missing (vendor_id, service_id, businessName, city, state, pincode)" 
            });
        }

        // Check if business profile already exists for this vendor and service
        const existingProfile = await BusinessProfile.findOne({ 
            vendor_id, 
            service_id: resolvedServiceId 
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
            profilePicture = files.profilePicture[0].key;
        }

        let documents = {
            aadharFront: files.aadharFront ? files.aadharFront[0].key : "",
            aadharBack: files.aadharBack ? files.aadharBack[0].key : "",
            registrationCopy: files.registrationCopy ? files.registrationCopy[0].key : "",
            gst: files.gst ? files.gst[0].key : ""
        };

        const coverImages = files.coverImages ? files.coverImages.map((file) => file.key) : [];

        // Parse skills and languages (they come as comma-separated strings or arrays)
        const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
        const languagesArray = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : []);

        const newBusinessProfile = new BusinessProfile({
            vendor_id,
            service_id: resolvedServiceId,
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
            about_us: about_us || '',
            communication_address: communication_address || '',
            cover_images: coverImages
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
    const {
    vendor_id,
    service_id,
    serviceName,
        businessName,
        doorNumber,
        area,
        landmark,
        city,
        state,
        pincode,
        skills,
        languages,
        about_us,
        communication_address
    } = req.body;
    
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
            profilePicture = files.profilePicture[0].key;
        }

        let documents = { ...businessProfile.documents };
        if (files.aadharFront) documents.aadharFront = files.aadharFront[0].key;
        if (files.aadharBack) documents.aadharBack = files.aadharBack[0].key;
        if (files.registrationCopy) documents.registrationCopy = files.registrationCopy[0].key;
        if (files.gst) documents.gst = files.gst[0].key;

        const existingCoverImages = businessProfile.cover_images || [];
        const incomingCoverImages = files.coverImages
            ? files.coverImages.map((file) => file.key)
            : [];
        const coverImages = [...existingCoverImages, ...incomingCoverImages].slice(0, 3);

        // Parse skills and languages
        const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : businessProfile.skills);
        const languagesArray = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : businessProfile.languages);

    const resolvedServiceId = service_id || serviceName || businessProfile.service_id;

    const result = await BusinessProfile.findByIdAndUpdate(
            id,
            {
        service_id: resolvedServiceId,
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
                about_us: about_us ?? businessProfile.about_us,
                communication_address: communication_address ?? businessProfile.communication_address,
                cover_images: coverImages,
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
        const businessProfiles = await BusinessProfile.find()
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');
        if (!businessProfiles || businessProfiles.length === 0) {
            return res.status(404).json({ status: false, message: "No business profiles found" });
        }

        const profilesList = businessProfiles.map(profile => {
            return {
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
                    aadharFront: profile.documents.aadharFront ? baseUrl + profile.documents.aadharFront : "",
                    aadharBack: profile.documents.aadharBack ? baseUrl + profile.documents.aadharBack : "",
                    registrationCopy: profile.documents.registrationCopy ? baseUrl + profile.documents.registrationCopy : "",
                    gst: profile.documents.gst ? baseUrl + profile.documents.gst : ""
                },
                about_us: profile.about_us || "",
                communication_address: profile.communication_address || "",
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
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
        const businessProfile = await BusinessProfile.findById(id)
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        const response = {
            _id: businessProfile._id,
            vendor_id: businessProfile.vendor_id,
            service_id: businessProfile.service_id,
            serviceName: businessProfile.service_id?.serviceName || "",
            serviceType: businessProfile.service_id?.serviceType || "",
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
            about_us: businessProfile.about_us || "",
            communication_address: businessProfile.communication_address || "",
            cover_images: businessProfile.cover_images?.map((img) => baseUrl + img) || [],
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
        const businessProfiles = await BusinessProfile.find({ vendor_id })
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');
        if (!businessProfiles || businessProfiles.length === 0) {
            return res.status(404).json({ status: false, message: "No business profiles found for this vendor" });
        }

        const profilesList = businessProfiles.map(profile => {
            return {
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
                    aadharFront: profile.documents.aadharFront ? baseUrl + profile.documents.aadharFront : "",
                    aadharBack: profile.documents.aadharBack ? baseUrl + profile.documents.aadharBack : "",
                    registrationCopy: profile.documents.registrationCopy ? baseUrl + profile.documents.registrationCopy : "",
                    gst: profile.documents.gst ? baseUrl + profile.documents.gst : ""
                },
                about_us: profile.about_us || "",
                communication_address: profile.communication_address || "",
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
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

exports.detailsById = async (req, res) => {
    const { id } = req.params;

    try {
        const businessProfile = await BusinessProfile.findById(id)
            .populate('vendor_id', 'name email mobile_number profile_image address city state is_profile_verified is_profile_completed is_otp_verified')
            .populate('service_id', 'serviceName serviceType');

        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        const vendor = await Vendor.findById(businessProfile.vendor_id?._id || businessProfile.vendor_id, '-password -__v');
        const vendorResponse = vendor
            ? {
                ...vendor.toObject(),
                profile_image: vendor.profile_image ? baseUrl + vendor.profile_image : ""
            }
            : null;

        const businessProfileResponse = {
            ...businessProfile.toObject(),
            profilePicture: businessProfile.profilePicture ? baseUrl + businessProfile.profilePicture : "",
            documents: {
                aadharFront: businessProfile.documents?.aadharFront ? baseUrl + businessProfile.documents.aadharFront : "",
                aadharBack: businessProfile.documents?.aadharBack ? baseUrl + businessProfile.documents.aadharBack : "",
                registrationCopy: businessProfile.documents?.registrationCopy ? baseUrl + businessProfile.documents.registrationCopy : "",
                gst: businessProfile.documents?.gst ? baseUrl + businessProfile.documents.gst : ""
            },
            cover_images: businessProfile.cover_images?.map((img) => baseUrl + img) || []
        };

        const portfolio = await BusinessPortfolio.findOne({ business_profile_id: id })
            .populate('events.event_id', 'eventName image')
            .populate('service_id', 'serviceName serviceType');

        const portfolioResponse = portfolio
            ? {
                ...portfolio.toObject(),
                events: portfolio.events.map((event) => ({
                    ...event.toObject(),
                    images: mapFileUrls(event.images),
                    videos: mapFileUrls(event.videos)
                }))
            }
            : null;

        const packages = await BusinessPackage.find({
            vendor_id: businessProfile.vendor_id?._id || businessProfile.vendor_id,
            service_id: businessProfile.service_id?._id || businessProfile.service_id
        })
            .populate('event_id', 'eventName')
            .sort({ createdAt: -1 });

        const packageResponse = packages.map((pkg) => {
            const data = pkg.toObject();
            return {
                ...data,
                coverImage: data.coverImage ? baseUrl + data.coverImage : ""
            };
        });

        const events = await Event.find({ service_ids: businessProfile.service_id?._id || businessProfile.service_id })
            .select('eventName image')
            .sort({ createdAt: -1 });

        const eventResponse = events.map((event) => ({
            ...event.toObject(),
            image: event.image ? baseUrl + event.image : ""
        }));

        res.status(200).json({
            status: true,
            message: 'Business profile details',
            data: {
                business_profile: businessProfileResponse,
                vendor: vendorResponse,
                portfolio: portfolioResponse,
                packages: packageResponse,
                events: eventResponse
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.deleteCoverImage = async (req, res) => {
    const { id } = req.params;
    const { vendor_id, image } = req.body;

    try {
        if (!image) {
            return res.status(400).json({ status: false, message: "Image is required" });
        }

        const businessProfile = await BusinessProfile.findOne({ _id: id });
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: "Business profile not found" });
        }

        if (businessProfile.vendor_id.toString() !== vendor_id) {
            return res.status(403).json({ status: false, message: "Unauthorized access" });
        }

        const normalizedImage = image.startsWith(baseUrl)
            ? image.replace(baseUrl, "")
            : image;

        businessProfile.cover_images = (businessProfile.cover_images || []).filter(
            (file) => file !== normalizedImage
        );

        const result = await businessProfile.save();

        res.status(200).json({
            status: true,
            message: "Cover image deleted successfully.",
            data: {
                ...result.toObject(),
                cover_images: result.cover_images?.map((file) => baseUrl + file) || []
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
