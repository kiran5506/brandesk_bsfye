const BusinessPackage = require('../models/businessPackageModel');
const City = require('../models/cityModel');
const mongoose = require('mongoose');
const baseUrl = process.env.BASE_URL || '';

const parseCityPricing = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        return [];
    }
};

const resolveCityId = async (cityInput) => {
    if (!cityInput) return null;
    const value = String(cityInput).trim();
    if (!value) return null;

    if (mongoose.Types.ObjectId.isValid(value)) {
        const cityDoc = await City.findById(value).select('_id');
        return cityDoc ? cityDoc._id.toString() : null;
    }

    const cityDoc = await City.findOne({ cityName: { $regex: `^${value}$`, $options: 'i' } }).select('_id');
    return cityDoc ? cityDoc._id.toString() : null;
};

const normalizePricing = async (pricing = []) => {
    const normalized = await Promise.all(
        pricing.map(async (item) => {
            const resolvedCityId = await resolveCityId(item?.city_id || item?.city);
            if (!resolvedCityId) return null;

            return {
                city_id: resolvedCityId,
                marketPrice: Number(item.marketPrice || 0),
                offerPrice: Number(item.offerPrice || 0),
                discount: Number(item.discount || 0)
            };
        })
    );

    return normalized.filter(Boolean);
};

const mapPackageResponse = (pkg) => {
    if (!pkg) return pkg;
    const data = pkg.toObject ? pkg.toObject() : pkg;
    if (data.coverImage) {
        data.coverImage = `${baseUrl}${data.coverImage}`;
    }
    data.cityPricing = Array.isArray(data.cityPricing)
        ? data.cityPricing.map((item) => ({
            ...item,
            city_id: item?.city_id?._id || item?.city_id || '',
            city_name: item?.city_id?.cityName || item?.city_name || ''
        }))
        : [];
    return data;
};

exports.create = async (req, res) => {
    const files = req.files;
    const { vendor_id, service_id, event_id, packageName, description } = req.body;

    try {
        if (!vendor_id || !event_id) {
            return res.status(400).json({ status: false, message: 'Vendor and event are required.' });
        }

        let coverImage = '';
        if (files && files.coverImage) {
            coverImage = files.coverImage[0].key;
        }

    const cityPricing = await normalizePricing(parseCityPricing(req.body.cityPricing));

        const newPackage = new BusinessPackage({
            vendor_id,
            service_id,
            event_id,
            packageName,
            description,
            coverImage,
            cityPricing
        });

        const result = await newPackage.save();
        res.status(201).json({ status: true, message: 'Business package created successfully.', data: result });
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const files = req.files;
    const { vendor_id, service_id, event_id, packageName, description } = req.body;

    try {
        const existingPackage = await BusinessPackage.findById(id);
        if (!existingPackage) {
            return res.status(404).json({ status: false, message: 'Business package not found' });
        }

        let coverImage = existingPackage.coverImage;
        if (files && files.coverImage) {
            coverImage = files.coverImage[0].key;
        }

    const cityPricing = await normalizePricing(parseCityPricing(req.body.cityPricing));

        const updatedPackage = await BusinessPackage.findByIdAndUpdate(
            id,
            {
                vendor_id: vendor_id || existingPackage.vendor_id,
                service_id: service_id || existingPackage.service_id,
                event_id: event_id || existingPackage.event_id,
                packageName,
                description,
                coverImage,
                cityPricing
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Business package updated successfully.', data: updatedPackage });
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const filter = {};
        if (req.query.vendor_id) {
            filter.vendor_id = req.query.vendor_id;
        }
        if (req.query.event_id) {
            filter.event_id = req.query.event_id;
        }

        const packages = await BusinessPackage.find(filter)
            .populate('event_id', 'eventName')
            .populate('cityPricing.city_id', 'cityName')
            .sort({ createdAt: -1 });

        if (!packages || packages.length === 0) {
            return res.status(404).json({ status: false, message: 'No business packages found.' });
        }

        const data = packages.map((pkg) => mapPackageResponse(pkg));
        res.status(200).json({ status: true, message: 'Business packages list.', data });
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};

exports.listByVendor = async (req, res) => {
    req.query.vendor_id = req.params.vendor_id;
    return exports.list(req, res);
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    try {
        const businessPackage = await BusinessPackage.findById(id)
            .populate('event_id', 'eventName')
            .populate('cityPricing.city_id', 'cityName');
        if (!businessPackage) {
            return res.status(404).json({ status: false, message: 'Business package not found.' });
        }
        res.status(200).json({ status: true, message: 'Business package data.', data: mapPackageResponse(businessPackage) });
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        const businessPackage = await BusinessPackage.findById(id);
        if (!businessPackage) {
            return res.status(404).json({ status: false, message: 'Business package not found.' });
        }
        await BusinessPackage.deleteOne({ _id: id });
        res.status(200).json({ status: true, message: 'Business package deleted successfully.' });
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
};
