const BusinessPortfolio = require('../models/businessPortfolioModel');
const BusinessProfile = require('../models/businessProfileModel');
const baseUrl = process.env.BASE_URL;

const mapFileUrls = (files = []) => files.map((file) => baseUrl + file);

exports.create = async (req, res) => {
    const { vendor_id, business_profile_id, service_id, events } = req.body;
    const files = req.files || [];

    try {
        if (!vendor_id || !business_profile_id || !service_id) {
            return res.status(400).json({
                status: false,
                message: 'Required fields are missing (vendor_id, business_profile_id, service_id)'
            });
        }

        const businessProfile = await BusinessProfile.findOne({ _id: business_profile_id, vendor_id });
        if (!businessProfile) {
            return res.status(404).json({ status: false, message: 'Business profile not found' });
        }

    const parsedEvents = events ? JSON.parse(events) : [];
        const fileMap = files.reduce((acc, file) => {
            if (!acc[file.fieldname]) {
                acc[file.fieldname] = [];
            }
            acc[file.fieldname].push(file.key);
            return acc;
        }, {});

        const eventPayload = parsedEvents.map((event) => {
            const eventId = event.event_id || event;
            const images = fileMap[`images_${eventId}`] || [];
            const videos = fileMap[`videos_${eventId}`] || [];
            return {
                event_id: eventId,
                images,
                videos
            };
        });

        let portfolio = await BusinessPortfolio.findOne({
            vendor_id,
            business_profile_id,
            service_id
        });

        if (!portfolio) {
            portfolio = new BusinessPortfolio({
                vendor_id,
                business_profile_id,
                service_id,
                events: eventPayload
            });
        } else {
            eventPayload.forEach((incoming) => {
                const existing = portfolio.events.find((event) => event.event_id.toString() === incoming.event_id.toString());
                if (existing) {
                    existing.images = [...(existing.images || []), ...incoming.images].filter(Boolean);
                    existing.videos = [...(existing.videos || []), ...incoming.videos].filter(Boolean);
                } else {
                    portfolio.events.push(incoming);
                }
            });
        }

        const result = await portfolio.save();

        res.status(201).json({
            status: true,
            message: 'Business portfolio created successfully.',
            data: {
                ...result.toObject(),
                events: result.events.map((event) => ({
                    ...event.toObject(),
                    images: mapFileUrls(event.images),
                    videos: mapFileUrls(event.videos)
                }))
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.listByVendor = async (req, res) => {
    const { vendor_id } = req.params;

    try {
        const portfolios = await BusinessPortfolio.find({ vendor_id })
            .populate('service_id', 'serviceName serviceType')
            .populate('events.event_id', 'eventName');

        if (!portfolios || portfolios.length === 0) {
            return res.status(404).json({ status: false, message: 'No portfolios found for this vendor' });
        }

        const response = portfolios.map((portfolio) => ({
            ...portfolio.toObject(),
            events: portfolio.events.map((event) => ({
                ...event.toObject(),
                images: mapFileUrls(event.images),
                videos: mapFileUrls(event.videos)
            }))
        }));

        res.status(200).json({ status: true, message: 'Business portfolios list.', data: response });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.deleteMedia = async (req, res) => {
    const { id } = req.params;
    const { vendor_id, event_id, type, file } = req.body;

    try {
        if (!vendor_id || !event_id || !type || !file) {
            return res.status(400).json({
                status: false,
                message: 'Required fields are missing (vendor_id, event_id, type, file)'
            });
        }

        const portfolio = await BusinessPortfolio.findOne({ _id: id, vendor_id });
        if (!portfolio) {
            return res.status(404).json({ status: false, message: 'Business portfolio not found' });
        }

        const eventEntry = portfolio.events.find(
            (event) => event.event_id.toString() === event_id.toString()
        );
        if (!eventEntry) {
            return res.status(404).json({ status: false, message: 'Event not found in portfolio' });
        }

        const normalizedFile = file.startsWith(baseUrl) ? file.replace(baseUrl, '') : file;
        if (type === 'image') {
            eventEntry.images = (eventEntry.images || []).filter((item) => item !== normalizedFile);
        } else if (type === 'video') {
            eventEntry.videos = (eventEntry.videos || []).filter((item) => item !== normalizedFile);
        } else {
            return res.status(400).json({ status: false, message: 'Invalid media type' });
        }

        const result = await portfolio.save();

        res.status(200).json({
            status: true,
            message: 'Portfolio media deleted successfully.',
            data: {
                ...result.toObject(),
                events: result.events.map((event) => ({
                    ...event.toObject(),
                    images: mapFileUrls(event.images),
                    videos: mapFileUrls(event.videos)
                }))
            }
        });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
