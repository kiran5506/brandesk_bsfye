const Video = require('../models/videoModel');

exports.create = async (req, res) => {
    const { videoUrl } = req.body;

    try {
        if (!videoUrl) {
            return res.status(400).json({ status: false, message: "Video URL is required" });
        }

        const newVideo = new Video({ videoUrl });
        const result = await newVideo.save();
        res.status(201).json({ status: true, message: 'Video created successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { videoUrl } = req.body;

    try {
        const video = await Video.findOne({ _id: id });
        if (!video) {
            return res.status(404).json({ status: false, message: "Video not found" });
        }

        const result = await Video.findByIdAndUpdate(
            id,
            { videoUrl },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Video updated successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const video = await Video.findOne({ _id: id });
        if (!video) {
            return res.status(404).json({ status: false, message: "Video not found" });
        }

        await Video.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Video deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const videos = await Video.find().select('-createdAt -updatedAt -isActive -__v');
        if (!videos || videos.length === 0) {
            return res.status(404).json({ status: false, message: "No videos found" });
        }

        res.status(200).json({ status: true, message: 'Videos list.', data: videos });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const video = await Video.findById(id);
        if (!video) {
            return res.status(404).json({ status: false, message: "Video not found" });
        }

        res.status(200).json({ status: true, message: 'Video data', data: video });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
