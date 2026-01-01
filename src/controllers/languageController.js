const Language = require('../models/languageModel');

exports.create = async (req, res) => {
    const { languageName } = req.body;

    try {
        if (!languageName) {
            return res.status(400).json({ status: false, message: "Language name is required" });
        }

        const newLanguage = new Language({ languageName });
        const result = await newLanguage.save();
        res.status(201).json({ status: true, message: 'Language created successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Language already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { languageName } = req.body;

    try {
        const language = await Language.findOne({ _id: id });
        if (!language) {
            return res.status(404).json({ status: false, message: "Language not found" });
        }

        const result = await Language.findByIdAndUpdate(
            id,
            { languageName },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Language updated successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Language already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const language = await Language.findOne({ _id: id });
        if (!language) {
            return res.status(404).json({ status: false, message: "Language not found" });
        }

        await Language.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Language deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const languages = await Language.find().select('-createdAt -updatedAt -isActive -__v');
        if (!languages || languages.length === 0) {
            return res.status(404).json({ status: false, message: "No languages found" });
        }

        res.status(200).json({ status: true, message: 'Languages list.', data: languages });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const language = await Language.findById(id);
        if (!language) {
            return res.status(404).json({ status: false, message: "Language not found" });
        }

        res.status(200).json({ status: true, message: 'Language data', data: language });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
