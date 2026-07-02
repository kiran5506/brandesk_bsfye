const Service = require('../models/serviceModel');
const Vendor = require('../models/vendorModule');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const Review = require('../models/reviewModel');
const City = require('../models/cityModel');
const Event = require('../models/eventModel');
const mongoose = require('mongoose');
const baseUrl = process.env.BASE_URL;
const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [value];
};

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { serviceName, serviceType, portfolioType, skills, event_ids, description } = req.body;
    
    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].key;
        }

        const resolvedEventIds = normalizeArray(event_ids).length
        ? normalizeArray(event_ids)
        : normalizeArray(event_ids);

        const newService = new Service({
            serviceName,
            serviceType,
            portfolioType,
            image,
            skills,
            event_ids: resolvedEventIds.length > 0 ? resolvedEventIds : undefined,
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
    const { serviceName, serviceType, portfolioType, skills, event_ids, description } = req.body;
    
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

        const resolvedEventIds = normalizeArray(event_ids).length
        ? normalizeArray(event_ids)
        : normalizeArray(event_ids);

        const result = await Service.findByIdAndUpdate(
            id,
            {
                serviceName,
                serviceType,
                portfolioType,
                image,
                skills,
                event_ids: resolvedEventIds.length > 0 ? resolvedEventIds : service.event_ids,
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
        const services = await Service.find().select('-createdAt -updatedAt -description -skills -isActive').sort({ _id: -1 });;
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
                imagePath: service.image ? baseUrl + service.image : '',
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

        // Search business names from BusinessProfile instead of vendor names,
        // then keep only profiles whose vendors are active + verified + accepted.
        const matchedProfiles = await BusinessProfile.find({
            isActive: true,
            businessName: { $regex: regex }
        })
            .select('_id vendor_id service_id businessName')
            .sort({ businessName: 1, createdAt: -1 })
            .limit(50)
            .lean();

        const profileVendorIds = [...new Set(
            matchedProfiles
                .map((profile) => profile?.vendor_id)
                .filter(Boolean)
                .map((id) => id.toString())
        )].map((id) => new mongoose.Types.ObjectId(id));

        const eligibleVendors = profileVendorIds.length
            ? await Vendor.find({
                _id: { $in: profileVendorIds },
                isActive: true,
                is_profile_verified: true,
                profile_status: 'accepted'
            }, '_id')
                .lean()
            : [];

        const eligibleVendorSet = new Set(eligibleVendors.map((vendor) => vendor._id.toString()));

        // Deduplicate by vendor_id and keep first profile (businessName asc, newest first)
        const vendorProfiles = [];
        const seenVendors = new Set();
        matchedProfiles.forEach((profile) => {
            const vendorKey = (profile?.vendor_id || '').toString();
            if (!vendorKey) return;
            if (!eligibleVendorSet.has(vendorKey)) return;
            if (seenVendors.has(vendorKey)) return;
            seenVendors.add(vendorKey);
            vendorProfiles.push(profile);
        });

        const topVendorProfiles = vendorProfiles.slice(0, 10);

        const mergedResults = [
            ...services.map((service) => ({
                type: 'Service',
                value: service._id,
                label: service.serviceName,
                serviceType: service.serviceType
            })),
            ...topVendorProfiles.map((profile) => ({
                type: 'Vendor',
                value: profile.vendor_id,
                label: profile.businessName || '',
                serviceId: profile?.service_id?.toString?.() || profile?.service_id || null
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

        const events = await Event.find({
            _id: { $in: service.event_ids }
        }).select('eventName');

        const serviceObj = service.toObject();
        serviceObj.eventCategories = events.map(event => event.eventName);
        res.status(200).json({ status: true, message: 'Service data', data: serviceObj });
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
                event_ids: service.event_ids,
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
    const profileType = (req.query.type || req.query.profile_type || 'top').toString().trim().toLowerCase();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 12));
    const cityId = (req.query.city_id || req.query.cityId || '').toString().trim();
    const vendorId = (req.query.vendor_id || req.query.vendorId || '').toString().trim();
    const budgetSort = (req.query.budget_sort || req.query.budgetSort || '').toString().trim();
    const discountSort = (req.query.discount_sort || req.query.discountSort || '').toString().trim();
    const priority = (req.query.priority || req.query.order_priority || 'sort').toString().trim().toLowerCase();
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
            businessProfileFilter.selectedCities = { $in: [cityId] };
        }

        if (!['top', 'regular'].includes(profileType)) {
            return res.status(400).json({ status: false, message: 'Invalid type. Use top or regular.' });
        }

        if (!['recent', 'sort'].includes(priority)) {
            return res.status(400).json({ status: false, message: 'Invalid priority. Use recent or sort.' });
        }

        const vendorFilter = {
            credits: profileType === 'regular' ? { $eq: 0 } : { $gt: 0 }
        };

        if (vendorId) {
            const vendorObjectId = toObjectId(vendorId);
            if (!vendorObjectId) {
                return res.status(400).json({ status: false, message: 'Invalid vendor_id' });
            }
            vendorFilter._id = vendorObjectId;
        }

        const eligibleVendors = await Vendor.find(vendorFilter).select('_id');
        const eligibleVendorIds = eligibleVendors.map((vendor) => vendor._id);

        if (!eligibleVendorIds.length) {
            if (profileType !== 'top') {
                return res.status(200).json({
                    status: true,
                    message: 'Service data with business profiles',
                    data: {
                        service: serviceResponse,
                        business_profiles: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                            hasNextPage: false,
                            hasPrevPage: false
                        }
                    }
                });
            }
            // For 'top' type: if no vendors have credits, fall back to returning recent business profiles
            // for the service without vendor_id restriction so users still see recent profiles.
        } else {
            businessProfileFilter.vendor_id = { $in: eligibleVendorIds };
        }

        const businessProfiles = await BusinessProfile.find(businessProfileFilter)
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType')
            .sort({ createdAt: -1 });

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
        const businessProfileObjectIds = businessProfiles
            .map((profile) => toObjectId(profile?._id))
            .filter(Boolean);

        const serviceIds = businessProfiles
            .map((profile) => profile.service_id?._id || profile.service_id)
            .filter(Boolean);

        console.log(`Vendor IDs for packages query: ${vendorIds.map(id => id.toString()).join(', ')}`);
        console.log(`Business Profile IDs for packages query: ${businessProfileObjectIds.map(id => id.toString()).join(', ')}`);
        console.log(`Service IDs for packages query: ${serviceIds.map(id => id.toString()).join(', ')}`);

        const packages = await BusinessPackage.find({
            vendor_id: { $in: vendorIds },
            service_id: { $in: serviceIds }
        }).select('vendor_id business_profile_id cityPricing');

        console.log('kiran packages-->', JSON.stringify(packages, null, 2));

        // Prepare vendor ObjectId list for aggregation
        const vendorObjectIds = vendorIds
            .map((v) => toObjectId(v))
            .filter(Boolean);
        const serviceObjectId = toObjectId(id);
        // Compute average ratings scoped per business profile, with legacy per-vendor fallback.
        const ratingsFacet = await Review.aggregate([
            {
                $match: {
                    vendor_id: { $in: vendorObjectIds },
                    isActive: true,
                    status: { $ne: 'rejected' }
                }
            },
            {
                $facet: {
                    perBusinessProfile: [
                        {
                            $match: {
                                business_profile_id: { $in: businessProfileObjectIds }
                            }
                        },
                        {
                            $group: {
                                _id: '$business_profile_id',
                                averageRating: { $avg: '$rating' },
                                reviewCount: { $sum: 1 }
                            }
                        }
                    ],
                    perVendorLegacy: [
                        { $match: { service_id: serviceObjectId } },
                        {
                            $group: {
                                _id: '$vendor_id',
                                averageRating: { $avg: '$rating' },
                                reviewCount: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);

        console.log('kiran ratings facet-->', JSON.stringify(ratingsFacet, null, 2));

        const perBusinessProfileArr = (ratingsFacet && ratingsFacet[0] && ratingsFacet[0].perBusinessProfile) || [];
        const perVendorLegacyArr = (ratingsFacet && ratingsFacet[0] && ratingsFacet[0].perVendorLegacy) || [];

        const ratingsByBusinessProfile = perBusinessProfileArr.reduce((acc, item) => {
            const key = item?._id?.toString?.();
            if (!key) return acc;
            acc[key] = {
                averageRating: Number(item.averageRating || 0),
                reviewCount: Number(item.reviewCount || 0)
            };
            return acc;
        }, {});

        const ratingsByVendorLegacy = perVendorLegacyArr.reduce((acc, item) => {
            const key = item?._id?.toString?.();
            if (!key) return acc;
            acc[key] = {
                averageRating: Number(item.averageRating || 0),
                reviewCount: Number(item.reviewCount || 0)
            };
            return acc;
        }, {});

        console.log('kiran ratingsByBusinessProfile-->', JSON.stringify(packages, null, 2));

        const lowestByBusinessProfile = packages.reduce((acc, pkg) => {
            console.log(`Package-->`, JSON.stringify(pkg, null, 2));
            const profileId = pkg.vendor_id?.toString();
            console.log(`Processing package for business_profile_id: ${profileId}`);
            if (!profileId) return acc;
            const pricingList = Array.isArray(pkg.cityPricing) ? pkg.cityPricing : [];
            pricingList.forEach((pricing) => {
                const offer = Number(pricing?.offerPrice || 0);
                const market = Number(pricing?.marketPrice || 0);
                const discount = Number(pricing?.discount || 0);
                if (!offer) return;
                if (!acc[profileId] || offer < acc[profileId].offerPrice) {
                    acc[profileId] = {
                        offerPrice: offer,
                        marketPrice: market,
                        discount
                    };
                }
            });
            return acc;
        }, {});

        console.log('kiran lowestByBusinessProfile-->', JSON.stringify(lowestByBusinessProfile, null, 2));  

        const profilesList = businessProfiles.map(profile => {
            console.log(`\nMapping profile ID: ${JSON.stringify(profile.vendor_id?._id || profile.vendor_id)}`);
            const profileKey = profile?._id?.toString?.() || '';
            const vendorKey = (profile.vendor_id?._id || profile.vendor_id)?.toString();
            const lowestPricing = profileKey ? lowestByBusinessProfile[vendorKey] : null;

            console.log(`\nMapping profile ID: ${profileKey}`);
            console.log(`  Vendor ID: ${vendorKey}`);
            console.log(`  Lowest Pricing: ${JSON.stringify(lowestPricing)}`);

            const profileRatings = profileKey ? ratingsByBusinessProfile[profileKey] : null;
            const vendorLegacyRatings = vendorKey ? ratingsByVendorLegacy[vendorKey] : null;
            const averageRating = Number((profileRatings?.averageRating ?? vendorLegacyRatings?.averageRating ?? 0) || 0);
            const reviewCount = Number((profileRatings?.reviewCount ?? vendorLegacyRatings?.reviewCount ?? 0) || 0);

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
            averageRating,
            reviewCount
        });
        });

        console.log('\n=== MAPPED PROFILES_LIST ===');
        console.log(`Total mapped profiles: ${profilesList.length}`);
        console.log('First 5 mapped profiles (preserve DB order):');
        profilesList.slice(0, 5).forEach((p, i) => {
            console.log(`  [${i}] ID: ${p._id}, CreatedAt: ${p.createdAt}, lowestOfferPrice: ${p.lowestOfferPrice}, lowestDiscount: ${p.lowestDiscount}, avgRating: ${p.averageRating}`);
        });

        let filteredProfiles = profilesList;

        if (Number.isFinite(ratingFilter) && ratingFilter >= 1 && ratingFilter <= 5) {
            filteredProfiles = filteredProfiles.filter((profile) => Number(profile.averageRating || 0) >= ratingFilter);
            console.log(`Applied ratingFilter >= ${ratingFilter}, remaining: ${filteredProfiles.length}`);
            console.log('First 5 after rating filter:');
            filteredProfiles.slice(0,5).forEach((p,i)=>{
                console.log(`  [${i}] ID: ${p._id}, CreatedAt: ${p.createdAt}, avgRating: ${p.averageRating}`);
            });
        } else {
            console.log('No rating filter applied.');
        }

        // ALWAYS sort by recency (newest first) for ALL profile types at the database level
        // This ensures consistent ordering regardless of other filters
        // Sort by createdAt descending (newest first), then by other criteria as secondary
        const sortedProfiles = [...filteredProfiles].sort((a, b) => {
            // Primary: Always sort by createdAt descending (newest first)
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            const recencyDiff = timeB - timeA; // Descending order: newer first
            
            if (recencyDiff !== 0) return recencyDiff;
            
            // If same date, apply secondary sorts
            if (profileType === 'top') {
                // For top: use budget/discount as tiebreakers if specified
                if (budgetSort === 'low_to_high') {
                    const priceDiff = Number(a.lowestOfferPrice || 0) - Number(b.lowestOfferPrice || 0);
                    if (priceDiff !== 0) return priceDiff;
                } else if (budgetSort === 'high_to_low') {
                    const priceDiff = Number(b.lowestOfferPrice || 0) - Number(a.lowestOfferPrice || 0);
                    if (priceDiff !== 0) return priceDiff;
                }
                
                if (discountSort === 'low_to_high') {
                    const discDiff = Number(a.lowestDiscount || 0) - Number(b.lowestDiscount || 0);
                    if (discDiff !== 0) return discDiff;
                } else if (discountSort === 'high_to_low') {
                    const discDiff = Number(b.lowestDiscount || 0) - Number(a.lowestDiscount || 0);
                    if (discDiff !== 0) return discDiff;
                }
            } else if (profileType === 'regular') {
                // For regular: rating -> reviewCount as tiebreakers
                const ratingDiff = Number(b.averageRating || 0) - Number(a.averageRating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                const reviewDiff = Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
                if (reviewDiff !== 0) return reviewDiff;
            }
            
            return 0;
        });
        
        console.log('\n=== FINAL SORTED PROFILES ===');
        console.log(`Total after sort: ${sortedProfiles.length}`);
        sortedProfiles.slice(0,5).forEach((p,i)=>{
            console.log(`  [${i}] ID: ${p._id}, CreatedAt: ${p.createdAt}, lowestOfferPrice: ${p.lowestOfferPrice}, lowestDiscount: ${p.lowestDiscount}, avgRating: ${p.averageRating}`);
        });

        filteredProfiles = sortedProfiles;

        const total = filteredProfiles.length;
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
        const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const startIndex = (safePage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

        res.status(200).json({
            status: true,
            message: `Service data with ${profileType} business profiles`,
            data: {
                service: serviceResponse,
                business_profiles: paginatedProfiles,
                pagination: {
                    page: safePage,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: safePage < totalPages,
                    hasPrevPage: safePage > 1
                }
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.topSuggestions = async (req, res) => {
    const { business_profile_id: businessProfileId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(businessProfileId)) {
            return res.status(400).json({ status: false, message: 'Invalid business_profile_id' });
        }

        const currentBusinessProfile = await BusinessProfile.findById(businessProfileId)
            .select('_id service_id');

        if (!currentBusinessProfile) {
            return res.status(404).json({ status: false, message: 'Business profile not found' });
        }

        const events = await Event.find({
            service_ids: currentBusinessProfile.service_id,
            isActive: true
        }).select('serviceCategories');

        const categoryKeys = [...new Set(
            events
                .flatMap((event) => (Array.isArray(event?.serviceCategories) ? event.serviceCategories : []))
                .map((category) => String(category || '').trim())
                .filter(Boolean)
                .map((category) => category.toLowerCase())
        )];

        if (!categoryKeys.length) {
            return res.status(200).json({
                status: true,
                message: 'Top suggestions list.',
                data: {
                    service_categories: [],
                    business_profiles: []
                }
            });
        }

        const services = await Service.find({ isActive: true })
            .select('_id serviceName serviceType');

        const serviceByCategory = services.reduce((acc, serviceDoc) => {
            const key = String(serviceDoc?.serviceName || '').trim().toLowerCase();
            if (!key || acc[key]) return acc;
            acc[key] = serviceDoc;
            return acc;
        }, {});

        const matchedServices = categoryKeys
            .map((key) => serviceByCategory[key])
            .filter(Boolean);

        const uniqueServiceMap = matchedServices.reduce((acc, serviceDoc) => {
            const key = serviceDoc?._id?.toString?.();
            if (!key || acc[key]) return acc;
            acc[key] = serviceDoc;
            return acc;
        }, {});

        const serviceOrder = Object.keys(uniqueServiceMap);

        if (!serviceOrder.length) {
            return res.status(200).json({
                status: true,
                message: 'Top suggestions list.',
                data: {
                    service_categories: categoryKeys,
                    business_profiles: []
                }
            });
        }

        const serviceObjectIds = serviceOrder
            .map((value) => new mongoose.Types.ObjectId(value));

        const candidateProfiles = await BusinessProfile.find({
            service_id: { $in: serviceObjectIds },
            isActive: true,
            _id: { $ne: currentBusinessProfile._id }
        })
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType')
            .sort({ createdAt: -1 });

        if (!candidateProfiles.length) {
            return res.status(200).json({
                status: true,
                message: 'Top suggestions list.',
                data: {
                    service_categories: matchedServices.map((item) => item?.serviceName).filter(Boolean),
                    business_profiles: []
                }
            });
        }

        const candidateProfileIds = candidateProfiles.map((profile) => profile._id);

        const cityIds = [...new Set(
            candidateProfiles
                .map((profile) => profile?.address?.city)
                .filter(Boolean)
                .map((city) => city.toString())
                .filter((city) => mongoose.Types.ObjectId.isValid(city))
        )];

        const cityDocs = cityIds.length
            ? await City.find({ _id: { $in: cityIds } }).select('_id cityName')
            : [];

        const cityMap = cityDocs.reduce((acc, cityDoc) => {
            acc[cityDoc._id.toString()] = cityDoc.cityName;
            return acc;
        }, {});

        const ratings = await Review.aggregate([
            {
                $match: {
                    business_profile_id: { $in: candidateProfileIds },
                    isActive: true,
                    status: { $ne: 'rejected' }
                }
            },
            {
                $group: {
                    _id: '$business_profile_id',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        const ratingsMap = ratings.reduce((acc, item) => {
            const key = item?._id?.toString?.();
            if (!key) return acc;
            acc[key] = {
                averageRating: Number(item.averageRating || 0),
                reviewCount: Number(item.reviewCount || 0)
            };
            return acc;
        }, {});

        const packages = await BusinessPackage.find({
            business_profile_id: { $in: candidateProfileIds }
        }).select('business_profile_id cityPricing');

        const lowestByBusinessProfile = packages.reduce((acc, pkg) => {
            const profileId = pkg?.business_profile_id?.toString?.();
            if (!profileId) return acc;

            const pricingList = Array.isArray(pkg?.cityPricing) ? pkg.cityPricing : [];
            pricingList.forEach((pricing) => {
                const offer = Number(pricing?.offerPrice || 0);
                const market = Number(pricing?.marketPrice || 0);
                const discount = Number(pricing?.discount || 0);
                if (!offer) return;
                if (!acc[profileId] || offer < acc[profileId].offerPrice) {
                    acc[profileId] = {
                        offerPrice: offer,
                        marketPrice: market,
                        discount
                    };
                }
            });

            return acc;
        }, {});

        const normalizedProfiles = candidateProfiles.map((profile) => {
            const profileId = profile?._id?.toString?.() || '';
            const cityIdValue = profile?.address?.city ? profile.address.city.toString() : '';
            const cityName = cityIdValue ? (cityMap[cityIdValue] || profile?.address?.city) : profile?.address?.city;
            const lowestPricing = lowestByBusinessProfile[profileId] || null;
            const ratingData = ratingsMap[profileId] || null;

            return {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                service_id: profile.service_id,
                serviceName: profile.service_id?.serviceName || '',
                serviceType: profile.service_id?.serviceType || '',
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : '',
                address: {
                    ...(profile.address || {}),
                    city: cityName || '',
                    city_id: cityIdValue || ''
                },
                skills: profile.skills,
                languages: profile.languages,
                documents: {
                    aadharFront: profile.documents?.aadharFront ? baseUrl + profile.documents.aadharFront : '',
                    aadharBack: profile.documents?.aadharBack ? baseUrl + profile.documents.aadharBack : '',
                    registrationCopy: profile.documents?.registrationCopy ? baseUrl + profile.documents.registrationCopy : '',
                    gst: profile.documents?.gst ? baseUrl + profile.documents.gst : ''
                },
                about_us: profile.about_us || '',
                communication_address: profile.communication_address || '',
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
                lowestOfferPrice: lowestPricing?.offerPrice || 0,
                lowestMarketPrice: lowestPricing?.marketPrice || 0,
                lowestDiscount: lowestPricing?.discount || 0,
                averageRating: Number(ratingData?.averageRating || 0),
                reviewCount: Number(ratingData?.reviewCount || 0)
            };
        });

        const bestByService = normalizedProfiles.reduce((acc, profile) => {
            const serviceId = (profile?.service_id?._id || profile?.service_id || '').toString();
            if (!serviceId) return acc;

            const currentBest = acc[serviceId];
            if (!currentBest) {
                acc[serviceId] = profile;
                return acc;
            }

            const ratingDiff = Number(profile.averageRating || 0) - Number(currentBest.averageRating || 0);
            if (ratingDiff > 0) {
                acc[serviceId] = profile;
                return acc;
            }

            if (ratingDiff === 0) {
                const reviewDiff = Number(profile.reviewCount || 0) - Number(currentBest.reviewCount || 0);
                if (reviewDiff > 0) {
                    acc[serviceId] = profile;
                }
            }

            return acc;
        }, {});

        const topSuggestions = serviceOrder
            .map((serviceId) => bestByService[serviceId])
            .filter(Boolean);

        res.status(200).json({
            status: true,
            message: 'Top suggestions list.',
            data: {
                service_categories: serviceOrder
                    .map((serviceId) => uniqueServiceMap[serviceId]?.serviceName)
                    .filter(Boolean),
                business_profiles: topSuggestions
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.similarVendors = async (req, res) => {
    const { business_profile_id: businessProfileId } = req.params;
    const MAX_PROFILES = 14;
    const HALF_LIMIT = Math.floor(MAX_PROFILES / 2);

    try {
        if (!mongoose.Types.ObjectId.isValid(businessProfileId)) {
            return res.status(400).json({ status: false, message: 'Invalid business_profile_id' });
        }

        const currentBusinessProfile = await BusinessProfile.findById(businessProfileId)
            .select('_id service_id vendor_id');

        if (!currentBusinessProfile) {
            return res.status(404).json({ status: false, message: 'Business profile not found' });
        }

        const currentVendorId = currentBusinessProfile?.vendor_id;
        if (!currentVendorId) {
            return res.status(200).json({
                status: true,
                message: 'Similar vendors list.',
                data: {
                    business_profiles: []
                }
            });
        }

        const currentVendor = await Vendor.findById(currentVendorId)
            .select('_id approved_date profile_status is_profile_verified isActive');

        if (!currentVendor || !currentVendor?.approved_date) {
            return res.status(200).json({
                status: true,
                message: 'Similar vendors list.',
                data: {
                    business_profiles: []
                }
            });
        }

        const approvedDate = new Date(currentVendor.approved_date);
        const vendorBaseFilter = {
            _id: { $ne: currentVendor._id },
            isActive: true,
            is_profile_verified: true,
            profile_status: 'accepted',
            approved_date: { $exists: true, $ne: null }
        };

        const previousVendors = await Vendor.find({
            ...vendorBaseFilter,
            approved_date: { $lt: approvedDate }
        })
            .select('_id approved_date')
            .sort({ approved_date: -1 })
            .limit(HALF_LIMIT);

        const nextVendors = await Vendor.find({
            ...vendorBaseFilter,
            approved_date: { $gt: approvedDate }
        })
            .select('_id approved_date')
            .sort({ approved_date: 1 })
            .limit(HALF_LIMIT);

        const selectedVendorIds = [];
        const selectedVendorIdSet = new Set();

        [...previousVendors, ...nextVendors].forEach((vendorDoc) => {
            const vendorId = vendorDoc?._id?.toString?.();
            if (!vendorId || selectedVendorIdSet.has(vendorId)) return;
            selectedVendorIdSet.add(vendorId);
            selectedVendorIds.push(vendorDoc._id);
        });

        if (selectedVendorIds.length < MAX_PROFILES) {
            const fillVendors = await Vendor.find({
                ...vendorBaseFilter,
                _id: {
                    $nin: [
                        currentVendor._id,
                        ...selectedVendorIds
                    ]
                }
            })
                .select('_id approved_date')
                .sort({ approved_date: -1 })
                .limit(MAX_PROFILES - selectedVendorIds.length);

            fillVendors.forEach((vendorDoc) => {
                const vendorId = vendorDoc?._id?.toString?.();
                if (!vendorId || selectedVendorIdSet.has(vendorId)) return;
                selectedVendorIdSet.add(vendorId);
                selectedVendorIds.push(vendorDoc._id);
            });
        }

        if (!selectedVendorIds.length) {
            return res.status(200).json({
                status: true,
                message: 'Similar vendors list.',
                data: {
                    business_profiles: []
                }
            });
        }

        const candidateProfiles = await BusinessProfile.find({
            service_id: currentBusinessProfile.service_id,
            vendor_id: { $in: selectedVendorIds },
            isActive: true,
            _id: { $ne: currentBusinessProfile._id }
        })
            .populate('vendor_id', 'name email mobile_number approved_date')
            .populate('service_id', 'serviceName serviceType')
            .sort({ createdAt: -1 });

        if (!candidateProfiles.length) {
            return res.status(200).json({
                status: true,
                message: 'Similar vendors list.',
                data: {
                    business_profiles: []
                }
            });
        }

        const candidateProfileIds = candidateProfiles.map((profile) => profile._id);

        const cityIds = [...new Set(
            candidateProfiles
                .map((profile) => profile?.address?.city)
                .filter(Boolean)
                .map((city) => city.toString())
                .filter((city) => mongoose.Types.ObjectId.isValid(city))
        )];

        const cityDocs = cityIds.length
            ? await City.find({ _id: { $in: cityIds } }).select('_id cityName')
            : [];

        const cityMap = cityDocs.reduce((acc, cityDoc) => {
            acc[cityDoc._id.toString()] = cityDoc.cityName;
            return acc;
        }, {});

        const ratings = await Review.aggregate([
            {
                $match: {
                    business_profile_id: { $in: candidateProfileIds },
                    isActive: true,
                    status: { $ne: 'rejected' }
                }
            },
            {
                $group: {
                    _id: '$business_profile_id',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        const ratingsMap = ratings.reduce((acc, item) => {
            const key = item?._id?.toString?.();
            if (!key) return acc;
            acc[key] = {
                averageRating: Number(item.averageRating || 0),
                reviewCount: Number(item.reviewCount || 0)
            };
            return acc;
        }, {});

        const packages = await BusinessPackage.find({
            business_profile_id: { $in: candidateProfileIds }
        }).select('business_profile_id cityPricing');

        const lowestByBusinessProfile = packages.reduce((acc, pkg) => {
            const profileId = pkg?.business_profile_id?.toString?.();
            if (!profileId) return acc;

            const pricingList = Array.isArray(pkg?.cityPricing) ? pkg.cityPricing : [];
            pricingList.forEach((pricing) => {
                const offer = Number(pricing?.offerPrice || 0);
                const market = Number(pricing?.marketPrice || 0);
                const discount = Number(pricing?.discount || 0);
                if (!offer) return;
                if (!acc[profileId] || offer < acc[profileId].offerPrice) {
                    acc[profileId] = {
                        offerPrice: offer,
                        marketPrice: market,
                        discount
                    };
                }
            });

            return acc;
        }, {});

        const normalizedProfiles = candidateProfiles.map((profile) => {
            const profileId = profile?._id?.toString?.() || '';
            const cityIdValue = profile?.address?.city ? profile.address.city.toString() : '';
            const cityName = cityIdValue ? (cityMap[cityIdValue] || profile?.address?.city) : profile?.address?.city;
            const lowestPricing = lowestByBusinessProfile[profileId] || null;
            const ratingData = ratingsMap[profileId] || null;

            return {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                service_id: profile.service_id,
                serviceName: profile.service_id?.serviceName || '',
                serviceType: profile.service_id?.serviceType || '',
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : '',
                address: {
                    ...(profile.address || {}),
                    city: cityName || '',
                    city_id: cityIdValue || ''
                },
                skills: profile.skills,
                languages: profile.languages,
                documents: {
                    aadharFront: profile.documents?.aadharFront ? baseUrl + profile.documents.aadharFront : '',
                    aadharBack: profile.documents?.aadharBack ? baseUrl + profile.documents.aadharBack : '',
                    registrationCopy: profile.documents?.registrationCopy ? baseUrl + profile.documents.registrationCopy : '',
                    gst: profile.documents?.gst ? baseUrl + profile.documents.gst : ''
                },
                about_us: profile.about_us || '',
                communication_address: profile.communication_address || '',
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
                lowestOfferPrice: lowestPricing?.offerPrice || 0,
                lowestMarketPrice: lowestPricing?.marketPrice || 0,
                lowestDiscount: lowestPricing?.discount || 0,
                averageRating: Number(ratingData?.averageRating || 0),
                reviewCount: Number(ratingData?.reviewCount || 0)
            };
        });

        const bestByVendor = normalizedProfiles.reduce((acc, profile) => {
            const vendorId = (profile?.vendor_id?._id || profile?.vendor_id || '').toString();
            if (!vendorId) return acc;

            const currentBest = acc[vendorId];
            if (!currentBest) {
                acc[vendorId] = profile;
                return acc;
            }

            const ratingDiff = Number(profile.averageRating || 0) - Number(currentBest.averageRating || 0);
            if (ratingDiff > 0) {
                acc[vendorId] = profile;
                return acc;
            }

            if (ratingDiff === 0) {
                const reviewDiff = Number(profile.reviewCount || 0) - Number(currentBest.reviewCount || 0);
                if (reviewDiff > 0) {
                    acc[vendorId] = profile;
                    return acc;
                }

                if (reviewDiff === 0) {
                    const profileCreatedAt = new Date(profile?.createdAt || 0).getTime();
                    const bestCreatedAt = new Date(currentBest?.createdAt || 0).getTime();
                    if (profileCreatedAt > bestCreatedAt) {
                        acc[vendorId] = profile;
                    }
                }
            }

            return acc;
        }, {});

        const similarVendorProfiles = Object.values(bestByVendor)
            .sort((a, b) => {
                const ratingDiff = Number(b?.averageRating || 0) - Number(a?.averageRating || 0);
                if (ratingDiff !== 0) return ratingDiff;

                const reviewDiff = Number(b?.reviewCount || 0) - Number(a?.reviewCount || 0);
                if (reviewDiff !== 0) return reviewDiff;

                return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
            })
            .slice(0, MAX_PROFILES);

        res.status(200).json({
            status: true,
            message: 'Similar vendors list.',
            data: {
                business_profiles: similarVendorProfiles
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};


