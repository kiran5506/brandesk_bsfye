const Event = require('../models/eventModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { eventName, serviceCategory, skills } = req.body;

    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        }

        const skillsArray = skills ? (Array.isArray(skills) ? skills : [skills]) : [];

        const newEvent = new Event({
            eventName,
            serviceCategory,
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
    const { eventName, serviceCategory, skills } = req.body;

    try {
        const event = await Event.findOne({ _id: id });
        if (!event) {
            return res.status(404).json({ status: false, message: "Event not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        } else {
            image = event.image;
        }

        const skillsArray = skills ? (Array.isArray(skills) ? skills : [skills]) : event.skills;

        const result = await Event.findByIdAndUpdate(
            id,
            {
                eventName,
                serviceCategory,
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
        const events = await Event.find().select('-createdAt -updatedAt -isActive -__v -skills');
        if (!events || events.length === 0) {
            return res.status(404).json({ status: false, message: "No events found" });
        }

        const eventsList = events.map(event => {
            return {
                _id: event._id,
                eventName: event.eventName,
                serviceCategory: event.serviceCategory,
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

exports.findByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const events = await Event.find({ serviceCategory: category });
        if (!events || events.length === 0) {
            return res.status(404).json({ status: false, message: "No events found for this category" });
        }

        const eventsList = events.map(event => {
            return {
                _id: event._id,
                eventName: event.eventName,
                serviceCategory: event.serviceCategory,
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
