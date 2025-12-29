const LeadPackage = require('../models/leadPackageModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { packageName, totalLeads, amount, description } = req.body;

    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        }

        const newLeadPackage = new LeadPackage({
            packageName,
            totalLeads: parseInt(totalLeads),
            amount: parseFloat(amount),
            image,
            description
        });

        const result = await newLeadPackage.save();
        res.status(201).json({ status: true, message: 'Lead package created successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { packageName, totalLeads, amount, description } = req.body;

    try {
        const leadPackage = await LeadPackage.findOne({ _id: id });
        if (!leadPackage) {
            return res.status(404).json({ status: false, message: "Lead package not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        } else {
            image = leadPackage.image;
        }

        const result = await LeadPackage.findByIdAndUpdate(
            id,
            {
                packageName,
                totalLeads: parseInt(totalLeads),
                amount: parseFloat(amount),
                image,
                description
            },
            { new: true, runValidators: true }
        );

        console.log(result);
        res.status(200).json({ status: true, message: 'Lead package updated successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const leadPackage = await LeadPackage.findOne({ _id: id });
        if (!leadPackage) {
            return res.status(404).json({ status: false, message: "Lead package not found" });
        }

        await LeadPackage.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Lead package deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const leadPackages = await LeadPackage.find();
        if (!leadPackages || leadPackages.length === 0) {
            return res.status(404).json({ status: false, message: "No lead packages found" });
        }

        const packagesList = leadPackages.map(pkg => {
            return {
                _id: pkg._id,
                packageName: pkg.packageName,
                totalLeads: pkg.totalLeads,
                amount: pkg.amount,
                description: pkg.description,
                imagePath: baseUrl + pkg.image,
                isActive: pkg.isActive,
                createdAt: pkg.createdAt,
                updatedAt: pkg.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Lead packages list.', data: packagesList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const leadPackage = await LeadPackage.findById(id);
        if (!leadPackage) {
            return res.status(404).json({ status: false, message: "Lead package not found" });
        }

        if (leadPackage.image) {
            leadPackage.image = baseUrl + leadPackage.image;
        }

        res.status(200).json({ status: true, message: 'Lead package data', data: leadPackage });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
