const City = require('../models/cityModel');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.create = async (req, res) => {
    const { cityName } = req.body;
    try {
        if (!cityName) {
            return res.status(400).json({ status: false, message: "City name is required" });
        }

        const newCity = new City({ cityName });
        const result = await newCity.save();
        res.status(201).json({ status: true, message: 'City created successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "City already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { cityName } = req.body;

    try {
        if (!cityName) {
            return res.status(400).json({ status: false, message: "City name is required" });
        }

        const city = await City.findOne({ _id: id });
        if (!city) {
            return res.status(404).json({ status: false, message: "City not found" });
        }

        const result = await City.findByIdAndUpdate(
            id,
            { cityName },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'City updated successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "City already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    
    try {
        const city = await City.findOne({ _id: id });
        if (!city) {
            return res.status(404).json({ status: false, message: "City not found" });
        }

        await City.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'City deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const cities = await City.find().select('-createdAt -updatedAt -isActive -__v').sort({ _id: -1 });
        if (!cities || cities.length === 0) {
            return res.status(404).json({ status: false, message: "No cities found" });
        }

        res.status(200).json({ status: true, message: 'Cities list.', data: cities });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.search = async (req, res) => {
    const term = (req.query.q || req.query.search || '').trim();

    try {
        if (!term || term.length < 2) {
            return res.status(200).json({ status: true, message: 'City search results.', data: [] });
        }

        const regex = new RegExp(escapeRegExp(term), 'i');
        const cities = await City.find({ cityName: { $regex: regex }, isActive: true })
            .select('-createdAt -updatedAt -isActive -__v')
            .sort({ cityName: 1 })
            .limit(15);

        res.status(200).json({ status: true, message: 'City search results.', data: cities });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const city = await City.findById(id);
        if (!city) {
            return res.status(404).json({ status: false, message: "City not found" });
        }

        res.status(200).json({ status: true, message: 'City data', data: city });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
