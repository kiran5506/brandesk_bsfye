const BusinessProfile = require("../models/businessProfileModel");
const BusinessPortfolio = require("../models/businessPortfolioModel");
const BusinessPackage = require("../models/businessPackageModel");
const Event = require("../models/eventModel");
const Vendor = require("../models/vendorModule");
const Service = require('../models/serviceModel');
const City = require('../models/cityModel');
const mongoose = require('mongoose');
const baseUrl = process.env.BASE_URL;

const toAssetUrl = (file = '') => {
    const value = String(file || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (!baseUrl) return value;
    return `${baseUrl}${value}`;
};

const mapFileUrls = (files = []) => files.map((file) => toAssetUrl(file)).filter(Boolean);

const resolveCityId = async (city) => {
    if (!city) return null;

    const cityValue = String(city).trim();
    if (!cityValue) return null;

    if (mongoose.Types.ObjectId.isValid(cityValue)) {
        const cityDoc = await City.findById(cityValue).select('_id');
        return cityDoc ? cityDoc._id.toString() : null;
    }

    const cityDoc = await City.findOne({ cityName: { $regex: `^${cityValue}$`, $options: 'i' } }).select('_id');
    return cityDoc ? cityDoc._id.toString() : null;
};

const normalizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') {
        const s = value.trim();
        // If it looks like a JSON array, try parsing it
        if (s.startsWith('[') && s.endsWith(']')) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
            } catch (e) {
                // fallthrough to tolerant parsing below
            }
        }

        // Remove surrounding brackets/whitespace then split by comma
        const cleaned = s.replace(/^[\[\]\s]*|[\[\]\s]*$/g, '');
        return cleaned
            .split(',')
            .map((item) => String(item).replace(/^['"]+|['"]+$/g, '').trim())
            .filter(Boolean);
    }
    return [String(value)];
};

const resolveService = async ({ service_id, serviceName }) => {
    const serviceIdValue = String(service_id || '').trim();
    if (serviceIdValue && mongoose.Types.ObjectId.isValid(serviceIdValue)) {
        const byId = await Service.findById(serviceIdValue).select('_id serviceName event_ids');
        if (byId) return byId;
    }

    const serviceNameValue = String(serviceName || '').trim();
    if (serviceNameValue) {
        const byName = await Service.findOne({
            serviceName: { $regex: `^${serviceNameValue}$`, $options: 'i' }
        }).select('_id serviceName event_ids');
        if (byName) return byName;
    }

    return null;
};

const seedDefaultPortfolioAndPackages = async ({ vendorId, businessProfileId, serviceDoc, businessName = '' }) => {
    const eventIds = [...new Set((serviceDoc?.event_ids || []).map((id) => String(id)))]
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (eventIds.length === 0) {
        return { seededEvents: 0, createdPackages: 0 };
    }

    const existingPortfolio = await BusinessPortfolio.findOne({
        vendor_id: vendorId,
        business_profile_id: businessProfileId,
        service_id: serviceDoc._id
    });

    if (!existingPortfolio) {
        await BusinessPortfolio.create({
            vendor_id: vendorId,
            business_profile_id: businessProfileId,
            service_id: serviceDoc._id,
            events: eventIds.map((eventId) => ({
                event_id: eventId,
                images: [],
                youtube_media: []
            })),
            isActive: false
        });
    } else {
        const existingEventSet = new Set((existingPortfolio.events || []).map((item) => String(item.event_id)));
        eventIds.forEach((eventId) => {
            if (!existingEventSet.has(eventId)) {
                existingPortfolio.events.push({ event_id: eventId, images: [], youtube_media: [] });
            }
        });
        await existingPortfolio.save();
    }

    const existingPackages = await BusinessPackage.find({
        vendor_id: vendorId,
        service_id: serviceDoc._id,
        event_id: { $in: eventIds }
    }).select('event_id');

    const existingPackageEventSet = new Set(existingPackages.map((pkg) => String(pkg.event_id)));

    const eventDocs = await Event.find({ _id: { $in: eventIds } }).select('_id eventName');
    const eventNameMap = eventDocs.reduce((acc, eventDoc) => {
        acc[String(eventDoc._id)] = eventDoc.eventName || 'Event Package';
        return acc;
    }, {});

    const packagesToCreate = eventIds
        .filter((eventId) => !existingPackageEventSet.has(eventId))
        .map((eventId) => ({
            vendor_id: vendorId,
            service_id: serviceDoc._id,
            event_id: eventId,
            packageName: `${businessName || serviceDoc.serviceName || 'Business'} - ${eventNameMap[eventId] || 'Package'}`,
            description: '',
            coverImage: '',
            cityPricing: [],
            isActive: false
        }));

    if (packagesToCreate.length > 0) {
        await BusinessPackage.insertMany(packagesToCreate, { ordered: false });
    }

    return { seededEvents: eventIds.length, createdPackages: packagesToCreate.length };
};

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
        communication_address,
        selectedCities
    } = req.body;
    
    try {
        // Validate required fields
        const serviceDoc = await resolveService({ service_id, serviceName });
        const resolvedServiceId = serviceDoc?._id?.toString() || '';

        if (!vendor_id || !resolvedServiceId || !businessName || !city || !state || !pincode) {
            return res.status(400).json({ 
                status: false, 
                message: "Required fields are missing (vendor_id, service_id, businessName, city, state, pincode)" 
            });
        }

        if (!serviceDoc) {
            return res.status(400).json({
                status: false,
                message: 'Invalid service. Please select a valid service.'
            });
        }

        const resolvedCityId = await resolveCityId(city);
        if (!resolvedCityId) {
            return res.status(400).json({
                status: false,
                message: 'Invalid city. Please select a valid city from the list.'
            });
        }

    console.log('selectedCities before normalization:', selectedCities);

    const resolvedSelectedCities = normalizeArray(selectedCities);
    console.log('Resolved city ID:', resolvedCityId);
    console.log('Resolved selected cities:', resolvedSelectedCities);

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
                city: resolvedCityId,
                state,
                pincode
            },
            skills: skillsArray,
            languages: languagesArray,
            documents,
            about_us: about_us || '',
            communication_address: communication_address || '',
            cover_images: coverImages,
            selectedCities: resolvedSelectedCities
        });
        
        const result = await newBusinessProfile.save();

        const defaultsInfo = await seedDefaultPortfolioAndPackages({
            vendorId: vendor_id,
            businessProfileId: result._id,
            serviceDoc,
            businessName
        });

        res.status(201).json({ 
            status: true, 
            message: 'Business profile created successfully.', 
            data: {
                ...result.toObject(),
                defaultSeed: defaultsInfo
            }
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

        const resolvedCityId = await resolveCityId(city);
        if (!resolvedCityId) {
            return res.status(400).json({
                status: false,
                message: 'Invalid city. Please select a valid city from the list.'
            });
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
                    city: resolvedCityId,
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

        const cityIds = [...new Set(
            businessProfiles
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

        // Resolve selectedCities for each profile and prefetch the city names
        const allSelectedCityIds = [...new Set(
            businessProfiles
                .flatMap((profile) => normalizeArray(profile?.selectedCities))
                .filter(Boolean)
        )];
        console.log('All selected city ids (raw):', allSelectedCityIds);

        let selectedCityDocs = [];
        if (allSelectedCityIds.length) {
            const validObjectIds = allSelectedCityIds
                .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
                .map((id) => new mongoose.Types.ObjectId(String(id)));

            if (validObjectIds.length) {
                selectedCityDocs = await City.find({
                    _id: { $in: validObjectIds }
                }).select('cityName');
            }
        }

        const selectedCityMap = selectedCityDocs.reduce((acc, doc) => {
            acc[doc._id.toString()] = doc.cityName;
            return acc;
        }, {});
        console.log('Selected city map:', selectedCityMap);
        // Prefetch services for all service_ids present in the profiles, read their
        // event_ids, then fetch those Event documents and attach them per-service.
        const serviceIds = [...new Set(
            businessProfiles
                .map((profile) => (profile?.service_id?._id || profile?.service_id))
                .filter(Boolean)
                .map((s) => String(s))
        )].filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

        let eventsByService = {};
        if (serviceIds.length) {
            const serviceObjectIds = serviceIds.map((id) => new mongoose.Types.ObjectId(String(id)));

            // Fetch the services to read their event_ids
            const servicesWithEvents = await Service.find({ _id: { $in: serviceObjectIds } })
                .select('_id event_ids');

            // Collect all unique event ids referenced by these services
            const allEventIds = [...new Set(
                servicesWithEvents.flatMap((s) => (s.event_ids || []).map((e) => String(e)))
            )].filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

            let eventDocs = [];
            if (allEventIds.length) {
                const eventObjectIds = allEventIds.map((id) => new mongoose.Types.ObjectId(String(id)));
                eventDocs = await Event.find({ _id: { $in: eventObjectIds } })
                    .select('_id eventName image')
                    .sort({ createdAt: -1 });
            }

            const eventMap = eventDocs.reduce((acc, ev) => {
                acc[String(ev._id)] = {
                    _id: ev._id,
                    eventName: ev.eventName,
                    image: ev.image ? baseUrl + ev.image : ''
                };
                return acc;
            }, {});

            // Build eventsByService map from each service's event_ids
            servicesWithEvents.forEach((svc) => {
                const key = String(svc._id);
                eventsByService[key] = (svc.event_ids || [])
                    .map((eid) => eventMap[String(eid)])
                    .filter(Boolean);
            });
        }

        const profilesList = businessProfiles.map(profile => {
            const cityIdValue = profile?.address?.city ? profile.address.city.toString() : '';
            const resolvedCityName = cityIdValue ? (cityMap[cityIdValue] || profile?.address?.city) : profile?.address?.city;
            // Resolve selectedCities for this profile to an array of ids and map to names
            const resolvedSelectedCitiesForProfile = normalizeArray(profile?.selectedCities);
            const selectedCityNamesForProfile = resolvedSelectedCitiesForProfile
                .map((id) => selectedCityMap[String(id)]).filter(Boolean);
            const serviceIdValue = profile?.service_id?._id ? String(profile.service_id._id) : String(profile.service_id || '');
            const profileEvents = serviceIdValue ? (eventsByService[serviceIdValue] || []) : [];

            return {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                service_id: profile.service_id,
                serviceName: profile.service_id?.serviceName || "",
                serviceType: profile.service_id?.serviceType || "",
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : "",
                address: {
                    ...profile.address,
                    city: resolvedCityName || ""
                },
                selectedCities: resolvedSelectedCitiesForProfile,
                selectedCityNames: selectedCityNamesForProfile,
                events: profileEvents,
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
        const cityIdValue = businessProfile?.address?.city ? businessProfile.address.city.toString() : '';
        const cityDoc = cityIdValue
            ? await City.findById(cityIdValue).select('cityName')
            : null;
        const resolvedCityName = cityDoc?.cityName || businessProfile?.address?.city || '';

        const vendorResponse = vendor
            ? {
                ...vendor.toObject(),
                profile_image: vendor.profile_image ? baseUrl + vendor.profile_image : ""
            }
            : null;

        const businessProfileResponse = {
            ...businessProfile.toObject(),
            address: {
                ...(businessProfile.address || {}),
                city: resolvedCityName,
                city_id: cityIdValue
            },
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
                    youtube_media: (event.youtube_media || []).map((item) => ({
                        youtube_url: item?.youtube_url || ''
                    }))
                }))
            }
            : null;

        const packages = await BusinessPackage.find({
            vendor_id: businessProfile.vendor_id?._id || businessProfile.vendor_id,
            service_id: businessProfile.service_id?._id || businessProfile.service_id,
            isActive: true
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

        const eventIdsForService = await Service.findById(businessProfile.service_id?._id || businessProfile.service_id);

        const events = await Event.find({ _id: { $in: eventIdsForService?.event_ids || [] } })
            .select('eventName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            message: 'Business profile details',
            data: {
                business_profile: businessProfileResponse,
                vendor: vendorResponse,
                portfolio: portfolioResponse,
                packages: packageResponse,
                events: events
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
