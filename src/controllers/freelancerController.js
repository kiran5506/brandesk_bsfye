const Freelancer = require('../models/freelancerModel');
const baseUrl = process.env.BASE_URL;

const parseList = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => item.toString());
    }
    if (!value) {
        return [];
    }
    return value
        .toString()
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const buildFileUrls = (files = []) => {
    if (!baseUrl) {
        return files;
    }
    return files.map((fileName) => `${baseUrl}${fileName}`);
};

const buildFileUrl = (fileName = '') => {
    if (!fileName) {
        return '';
    }
    if (!baseUrl) {
        return fileName;
    }
    return `${baseUrl}${fileName}`;
};

exports.create = async (req, res) => {
    try {
        const files = req.files || {};
        const { name, mobile, email, city, services, skills, languages } = req.body;

        if (!name || !mobile || !email || !city) {
            return res.status(400).json({
                status: false,
                message: 'Required fields are missing (name, mobile, email, city).'
            });
        }

        const servicesArray = parseList(services);
        const skillsArray = parseList(skills);
        const languagesArray = parseList(languages);

        if (!servicesArray.length || !skillsArray.length || !languagesArray.length) {
            return res.status(400).json({
                status: false,
                message: 'Services, skills, and languages are required.'
            });
        }

        const profileImage = files.profile ? files.profile[0].filename : '';
        if (!profileImage) {
            return res.status(400).json({
                status: false,
                message: 'Profile image is required.'
            });
        }

        const imageFiles = files.images ? files.images.map((file) => file.filename) : [];
        if (!imageFiles.length) {
            return res.status(400).json({
                status: false,
                message: 'At least one image is required.'
            });
        }

        const videoFiles = files.videos ? files.videos.map((file) => file.filename) : [];

        const newFreelancer = new Freelancer({
            name,
            mobile,
            email,
            profileImage,
            city,
            services: servicesArray,
            skills: skillsArray,
            languages: languagesArray,
            images: imageFiles,
            videos: videoFiles
        });

        const result = await newFreelancer.save();

        res.status(201).json({
            status: true,
            message: 'Freelancer profile created successfully.',
            data: {
                ...result.toObject(),
                profileImage: buildFileUrl(result.profileImage),
                images: buildFileUrls(result.images),
                videos: buildFileUrls(result.videos)
            }
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};

exports.list = async (req, res) => {
    try {
        const freelancers = await Freelancer.find().sort({ createdAt: -1 });
        if (!freelancers || freelancers.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'No freelancer profiles found.'
            });
        }

        const results = freelancers.map((freelancer) => ({
            ...freelancer.toObject(),
            profileImage: buildFileUrl(freelancer.profileImage),
            images: buildFileUrls(freelancer.images),
            videos: buildFileUrls(freelancer.videos)
        }));

        res.status(200).json({
            status: true,
            message: 'Freelancer profiles list.',
            data: results
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};
