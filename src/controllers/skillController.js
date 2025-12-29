const Skill = require('../models/skillModel');

exports.create = async (req, res) => {
    const { skillName } = req.body;

    try {
        if (!skillName) {
            return res.status(400).json({ status: false, message: "Skill name is required" });
        }

        const newSkill = new Skill({ skillName });
        const result = await newSkill.save();
        res.status(201).json({ status: true, message: 'Skill created successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Skill already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { skillName } = req.body;

    try {
        const skill = await Skill.findOne({ _id: id });
        if (!skill) {
            return res.status(404).json({ status: false, message: "Skill not found" });
        }

        const result = await Skill.findByIdAndUpdate(
            id,
            { skillName },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Skill updated successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Skill already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const skill = await Skill.findOne({ _id: id });
        if (!skill) {
            return res.status(404).json({ status: false, message: "Skill not found" });
        }

        await Skill.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Skill deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const skills = await Skill.find();
        if (!skills || skills.length === 0) {
            return res.status(404).json({ status: false, message: "No skills found" });
        }

        res.status(200).json({ status: true, message: 'Skills list.', data: skills });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const skill = await Skill.findById(id);
        if (!skill) {
            return res.status(404).json({ status: false, message: "Skill not found" });
        }

        res.status(200).json({ status: true, message: 'Skill data', data: skill });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
