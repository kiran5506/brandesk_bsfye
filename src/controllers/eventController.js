const Event = require('../models/eventModel');
const Service = require('../models/serviceModel');
const baseUrl = process.env.BASE_URL;

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
    const { eventName, serviceCategory, serviceCategories, service_id, service_ids, skills } = req.body;

    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].key;
        }

        const skillsArray = skills ? (Array.isArray(skills) ? skills : [skills]) : [];

        const resolvedServiceIds = normalizeArray(service_ids).length
            ? normalizeArray(service_ids)
            : normalizeArray(service_id);

        let resolvedServiceCategories = normalizeArray(serviceCategories).length
            ? normalizeArray(serviceCategories)
            : normalizeArray(serviceCategory);

        if (resolvedServiceCategories.length === 0 && resolvedServiceIds.length > 0) {
            const services = await Service.find({ _id: { $in: resolvedServiceIds } }).select('serviceName');
            resolvedServiceCategories = services.map((service) => service.serviceName).filter(Boolean);
        }

        const newEvent = new Event({
            eventName,
            service_ids: resolvedServiceIds.length > 0 ? resolvedServiceIds : undefined,
            serviceCategories: resolvedServiceCategories,
            image,
            skills: skillsArray
        });

        const result = await newEvent.save();
        res.status(201).json({ status: true, message: 'Event created successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { eventName, serviceCategory, serviceCategories, service_id, service_ids, skills } = req.body;

    try {
        const event = await Event.findOne({ _id: id });
        if (!event) {
            return res.status(404).json({ status: false, message: "Event not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].key;
        } else {
            image = event.image;
        }

        const skillsArray = skills ? (Array.isArray(skills) ? skills : [skills]) : event.skills;

        const resolvedServiceIds = normalizeArray(service_ids).length
            ? normalizeArray(service_ids)
            : normalizeArray(service_id);

        let resolvedServiceCategories = normalizeArray(serviceCategories).length
            ? normalizeArray(serviceCategories)
            : normalizeArray(serviceCategory);

        if (resolvedServiceCategories.length === 0 && resolvedServiceIds.length > 0) {
            const services = await Service.find({ _id: { $in: resolvedServiceIds } }).select('serviceName');
            resolvedServiceCategories = services.map((service) => service.serviceName).filter(Boolean);
        }

        if (resolvedServiceCategories.length === 0) {
            resolvedServiceCategories = event.serviceCategories || [];
        }

        const result = await Event.findByIdAndUpdate(
            id,
            {
                eventName,
                service_ids: resolvedServiceIds.length > 0 ? resolvedServiceIds : event.service_ids,
                serviceCategories: resolvedServiceCategories,
                image,
                skills: skillsArray
            },
            { new: true, runValidators: true }
        );

        console.log(result);
        res.status(200).json({ status: true, message: 'Event updated successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findOne({ _id: id });
        if (!event) {
            return res.status(404).json({ status: false, message: "Event not found" });
        }

        await Event.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Event deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const events = await Event.find().select('-createdAt -updatedAt -isActive -__v -skills').sort({ _id: -1 });
        if (!events || events.length === 0) {
            return res.status(404).json({ status: false, message: "No events found" });
        }

        const eventsList = events.map(event => {
            return {
                _id: event._id,
                eventName: event.eventName,
                //service_ids: event.service_ids,
                //serviceCategories: event.serviceCategories,
                serviceCategory: event.serviceCategories ? event.serviceCategories.join(', ') : '',
                skills: event.skills,
                imagePath: baseUrl + event.image,
                isActive: event.isActive,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Events list.', data: eventsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
    const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ status: false, message: "Event not found" });
        }

        if (event.image) {
            event.image = baseUrl + event.image;
        }

        res.status(200).json({ status: true, message: 'Event data', data: event });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByServiceId = async (req, res) => {
    const { service_id } = req.params;

    try {
        const service = await Service.findById(service_id).select('serviceName');
        const serviceName = service?.serviceName;

        const events = await Event.find({
            $or: [
                { service_ids: { $in: [service_id] } },
                ...(serviceName ? [{ serviceCategories: serviceName }] : [])
            ]
        });

        if (!events || events.length === 0) {
            return res.status(404).json({ status: false, message: 'No events found for this service' });
        }

        const eventsList = events.map(event => ({
            _id: event._id,
            eventName: event.eventName,
            service_ids: event.service_ids,
            serviceCategories: event.serviceCategories,
            serviceCategory: event.serviceCategories ? event.serviceCategories.join(', ') : '',
            skills: event.skills,
            imagePath: baseUrl + event.image,
            isActive: event.isActive,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt
        }));

        res.status(200).json({ status: true, message: 'Events by service.', data: eventsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByCategory = async (req, res) => {
    const { category } = req.params;

    try {
    const events = await Event.find({ serviceCategories: category });
        if (!events || events.length === 0) {
            return res.status(404).json({ status: false, message: "No events found for this category" });
        }

        const eventsList = events.map(event => {
            return {
                _id: event._id,
                eventName: event.eventName,
                serviceCategories: event.serviceCategories,
                serviceCategory: event.serviceCategories ? event.serviceCategories.join(', ') : '',
                skills: event.skills,
                imagePath: baseUrl + event.image,
                isActive: event.isActive,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Events by category.', data: eventsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
