const Service = require('../models/serviceModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { serviceName, serviceCategory, serviceType, portfolioType, skills, description } = req.body;
    
    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        }

        const newService = new Service({
            serviceName,
            serviceCategory,
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
    const { serviceName, serviceCategory, serviceType, portfolioType, skills, description } = req.body;
    
    try {
        const service = await Service.findOne({ _id: id });
        if (!service) {
            return res.status(404).json({ status: false, message: "Service data not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        } else {
            image = service.image;
        }

        const result = await Service.findByIdAndUpdate(
            id,
            {
                serviceName,
                serviceCategory,
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
                serviceCategory: service.serviceCategory,
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
    const { category } = req.params;
    
    try {
        const services = await Service.find({ serviceCategory: category });
        if (!services || services.length === 0) {
            return res.status(404).json({ status: false, message: "No services found for this category" });
        }

        const servicesList = services.map(service => {
            return {
                _id: service._id,
                serviceName: service.serviceName,
                serviceCategory: service.serviceCategory,
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
