const Service = require('../models/serviceModel');
const Vendor = require('../models/vendorModule');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const Review = require('../models/reviewModel');
const City = require('../models/cityModel');
const mongoose = require('mongoose');
const baseUrl = process.env.BASE_URL;
const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

exports.search = async (req, res) => {
    const term = (req.query.q || req.query.search || '').trim();

    try {
        if (!term || term.length < 2) {
            return res.status(200).json({ status: true, message: 'Service search results.', data: [] });
        }

        const regex = new RegExp(escapeRegExp(term), 'i');
        const services = await Service.find({
            isActive: true,
            $or: [
                { serviceName: { $regex: regex } },
                { serviceType: { $regex: regex } },
                { skills: { $regex: regex } }
            ]
        })
            .select('_id serviceName serviceType')
            .sort({ serviceName: 1 })
            .limit(10);

        const vendors = await Vendor.find({
            isActive: true,
            is_profile_verified: true,
            profile_status: 'accepted',
            $or: [
                { name: { $regex: regex } },
                { email: { $regex: regex } },
                { mobile_number: { $regex: regex } }
            ]
        }, '_id name')
            .sort({ name: 1 })
            .limit(10);

        const vendorIds = vendors.map((vendor) => vendor._id);
        const vendorProfiles = await BusinessProfile.find({
            vendor_id: { $in: vendorIds },
            isActive: true
        })
            .select('vendor_id service_id')
            .sort({ createdAt: -1 });

        const vendorServiceMap = vendorProfiles.reduce((acc, profile) => {
            const vendorKey = (profile?.vendor_id || '').toString();
            if (!vendorKey || acc[vendorKey]) return acc;
            acc[vendorKey] = profile?.service_id?.toString?.() || profile?.service_id || null;
            return acc;
        }, {});

        const mergedResults = [
            ...services.map((service) => ({
                type: 'Service',
                value: service._id,
                label: service.serviceName,
                serviceType: service.serviceType
            })),
            ...vendors.map((vendor) => ({
                type: 'Vendor',
                value: vendor._id,
                label: vendor.name,
                serviceId: vendorServiceMap[vendor._id.toString()] || null
            }))
        ];

        res.status(200).json({ status: true, message: 'Service/Vendor search results.', data: mergedResults });
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
    const cityId = (req.query.city_id || req.query.cityId || '').toString().trim();
    const vendorId = (req.query.vendor_id || req.query.vendorId || '').toString().trim();
    const budgetSort = (req.query.budget_sort || req.query.budgetSort || '').toString().trim();
    const discountSort = (req.query.discount_sort || req.query.discountSort || '').toString().trim();
    const ratingFilter = Number(req.query.rating || req.query.rating_min || req.query.ratingMin || 0);

    try {
        const toObjectId = (value) => {
            if (!value) return null;
            if (value instanceof mongoose.Types.ObjectId) return value;
            return mongoose.Types.ObjectId.isValid(value)
                ? new mongoose.Types.ObjectId(value)
                : null;
        };

        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        const serviceResponse = {
            ...service.toObject(),
            image: service.image ? baseUrl + service.image : ""
        };

        const businessProfileFilter = { service_id: id };
        if (cityId) {
            businessProfileFilter['address.city'] = cityId;
        }
        if (vendorId) {
            businessProfileFilter.vendor_id = vendorId;
        }

        const businessProfiles = await BusinessProfile.find(businessProfileFilter)
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');

        const cityIds = [...new Set(
            businessProfiles
                .map((profile) => profile?.address?.city)
                .filter(Boolean)
                .map((city) => city.toString())
        )];

        const cityDocs = cityIds.length
            ? await City.find({ _id: { $in: cityIds } }).select('_id cityName')
            : [];

        const cityMap = cityDocs.reduce((acc, cityDoc) => {
            acc[cityDoc._id.toString()] = cityDoc.cityName;
            return acc;
        }, {});

        const vendorIds = businessProfiles.map((profile) => profile.vendor_id?._id || profile.vendor_id);
        const packages = await BusinessPackage.find({
            vendor_id: { $in: vendorIds },
            service_id: id
        }).select('vendor_id cityPricing');

        // Prepare vendor ObjectId list for aggregation
        const vendorObjectIds = vendorIds
            .map((v) => toObjectId(v))
            .filter(Boolean);
        const serviceObjectId = toObjectId(id);

        console.log('kiran-->',serviceObjectId, vendorObjectIds);

        // Compute average ratings both scoped to the current service (per-service) and overall per vendor (fallback)
        const ratingsFacet = await Review.aggregate([
            {
                $match: {
                    vendor_id: { $in: vendorObjectIds },
                    isActive: true,
                    status: 'accepted'
                }
            },
            {
                $facet: {
                    perService: [
                        { $match: { service_id: serviceObjectId } },
                        { $group: { _id: '$vendor_id', averageRating: { $avg: '$rating' } } }
                    ],
                    perVendor: [
                        { $group: { _id: '$vendor_id', averageRating: { $avg: '$rating' } } }
                    ]
                }
            }
        ]);

        console.log('kiran ratings facet-->', JSON.stringify(ratingsFacet, null, 2));

        const perServiceArr = (ratingsFacet && ratingsFacet[0] && ratingsFacet[0].perService) || [];
        const perVendorArr = (ratingsFacet && ratingsFacet[0] && ratingsFacet[0].perVendor) || [];

        const ratingsByVendorService = perServiceArr.reduce((acc, item) => {
            acc[item._id?.toString()] = Number(item.averageRating || 0);
            return acc;
        }, {});

        const ratingsByVendor = perVendorArr.reduce((acc, item) => {
            acc[item._id?.toString()] = Number(item.averageRating || 0);
            return acc;
        }, {});

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
            // Prefer per-service average rating, fall back to overall vendor average
            const averageRating = vendorKey ? Number((ratingsByVendorService[vendorKey] !== undefined ? ratingsByVendorService[vendorKey] : ratingsByVendor[vendorKey]) || 0) : 0;
            const cityIdValue = profile?.address?.city ? profile.address.city.toString() : '';
            const cityName = cityIdValue ? (cityMap[cityIdValue] || profile?.address?.city) : profile?.address?.city;
            const normalizedAddress = {
                ...(profile.address || {}),
                city: cityName || '',
                city_id: cityIdValue || ''
            };
            return ({
            _id: profile._id,
            vendor_id: profile.vendor_id,
            service_id: profile.service_id,
            serviceName: profile.service_id?.serviceName || "",
            serviceType: profile.service_id?.serviceType || "",
            businessName: profile.businessName,
            profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : "",
            address: normalizedAddress,
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
            lowestDiscount: lowestPricing?.discount || 0,
            averageRating
        });
        });

        let filteredProfiles = profilesList;

        if (Number.isFinite(ratingFilter) && ratingFilter >= 1 && ratingFilter <= 5) {
            filteredProfiles = filteredProfiles.filter((profile) => Number(profile.averageRating || 0) >= ratingFilter);
        }

        if (budgetSort === 'low_to_high') {
            filteredProfiles = [...filteredProfiles].sort((a, b) => Number(a.lowestOfferPrice || 0) - Number(b.lowestOfferPrice || 0));
        } else if (budgetSort === 'high_to_low') {
            filteredProfiles = [...filteredProfiles].sort((a, b) => Number(b.lowestOfferPrice || 0) - Number(a.lowestOfferPrice || 0));
        }

        if (discountSort === 'low_to_high') {
            filteredProfiles = [...filteredProfiles].sort((a, b) => Number(a.lowestDiscount || 0) - Number(b.lowestDiscount || 0));
        } else if (discountSort === 'high_to_low') {
            filteredProfiles = [...filteredProfiles].sort((a, b) => Number(b.lowestDiscount || 0) - Number(a.lowestDiscount || 0));
        }

        res.status(200).json({
            status: true,
            message: 'Service data with business profiles',
            data: {
                service: serviceResponse,
                business_profiles: filteredProfiles
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
