const Service = require('../models/serviceModel');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { serviceName, serviceType, portfolioType, skills, description } = req.body;
    
    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].key;
        }

        const newService = new Service({
            serviceName,
            serviceType,
            portfolioType,
            image,
            skills,
            description
        });
        
        const result = await newService.save();
        res.status(201).json({ status: true, message: 'Service created successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { serviceName, serviceType, portfolioType, skills, description } = req.body;
    
    try {
        const service = await Service.findOne({ _id: id });
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].key;
        } else {
            image = service.image;
        }

        const result = await Service.findByIdAndUpdate(
            id,
            {
                serviceName,
                serviceType,
                portfolioType,
                image,
                skills,
                description
            },
            { new: true, runValidators: true }
        );

        console.log(result);
        res.status(200).json({ status: true, message: 'Service updated successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    
    try {
        const service = await Service.findOne({ _id: id });
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        const result = await Service.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(200).json({ status: true, message: 'Service deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const services = await Service.find().select('-createdAt -updatedAt -description -skills -isActive');
        if (!services || services.length === 0) {
            return res.status(404).json({ status: false, message: "No services found" });
        }

        const servicesList = services.map(service => {
            return {
                _id: service._id,
                serviceName: service.serviceName,
                serviceType: service.serviceType,
                portfolioType: service.portfolioType,
                skills: service.skills,
                description: service.description,
                imagePath: baseUrl + service.image,
                isActive: service.isActive,
                createdAt: service.createdAt,
                updatedAt: service.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Services list.', data: servicesList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        if (service.image) {
            service.image = baseUrl + service.image;
        }

        res.status(200).json({ status: true, message: 'Service data', data: service });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByCategory = async (req, res) => {
    const { name } = req.params;
    
    try {
        const services = await Service.find({ serviceName: name });
        if (!services || services.length === 0) {
            return res.status(404).json({ status: false, message: "No services found for this category" });
        }

        const servicesList = services.map(service => {
            return {
                _id: service._id,
                serviceName: service.serviceName,
                serviceType: service.serviceType,
                portfolioType: service.portfolioType,
                skills: service.skills,
                description: service.description,
                imagePath: baseUrl + service.image,
                isActive: service.isActive,
                createdAt: service.createdAt,
                updatedAt: service.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Services by category.', data: servicesList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByIdWithProfiles = async (req, res) => {
    const { id } = req.params;

    try {
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        const serviceResponse = {
            ...service.toObject(),
            image: service.image ? baseUrl + service.image : ""
        };

        const businessProfiles = await BusinessProfile.find({ service_id: id })
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');

        const vendorIds = businessProfiles.map((profile) => profile.vendor_id?._id || profile.vendor_id);
        const packages = await BusinessPackage.find({
            vendor_id: { $in: vendorIds },
            service_id: id
        }).select('vendor_id cityPricing');

        const lowestByVendor = packages.reduce((acc, pkg) => {
            const vendorId = pkg.vendor_id?.toString();
            if (!vendorId) return acc;
            const pricingList = Array.isArray(pkg.cityPricing) ? pkg.cityPricing : [];
            pricingList.forEach((pricing) => {
                const offer = Number(pricing?.offerPrice || 0);
                const market = Number(pricing?.marketPrice || 0);
                const discount = Number(pricing?.discount || 0);
                if (!offer) return;
                if (!acc[vendorId] || offer < acc[vendorId].offerPrice) {
                    acc[vendorId] = {
                        offerPrice: offer,
                        marketPrice: market,
                        discount
                    };
                }
            });
            return acc;
        }, {});

        const profilesList = businessProfiles.map(profile => {
            const vendorKey = (profile.vendor_id?._id || profile.vendor_id)?.toString();
            const lowestPricing = vendorKey ? lowestByVendor[vendorKey] : null;
            return ({
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
            updatedAt: profile.updatedAt,
            lowestOfferPrice: lowestPricing?.offerPrice || 0,
            lowestMarketPrice: lowestPricing?.marketPrice || 0,
            lowestDiscount: lowestPricing?.discount || 0
        });
        });

        res.status(200).json({
            status: true,
            message: 'Service data with business profiles',
            data: {
                service: serviceResponse,
                business_profiles: profilesList
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
