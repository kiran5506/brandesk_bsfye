const Testimonial = require('../models/testimonialModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { title, description, rating } = req.body;
    
    try {
        if (!title || !description || !rating) {
            return res.status(400).json({ status: false, message: "Title, description, and rating are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ status: false, message: "Rating must be between 1 and 5" });
        }

        let image = "";
        if (files) {
            image = files.image ? files.image[0].key : "";
        }

        if (!image) {
            return res.status(400).json({ status: false, message: "Image is required" });
        }

        const newTestimonial = new Testimonial({
            title,
            description,
            rating: parseInt(rating),
            image: image
        });

        const result = await newTestimonial.save();
        res.status(201).json({ status: true, message: 'Testimonial created successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { title, description, rating } = req.body;
    
    try {
        let image = "";

        const testimonial = await Testimonial.findOne({ _id: id });
        if (!testimonial) {
            return res.status(404).json({ status: false, message: "Testimonial not found" });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ status: false, message: "Rating must be between 1 and 5" });
        }

        if (files) {
            image = files.image ? files.image[0].key : testimonial.image;
        } else {
            image = testimonial.image;
        }

        const result = await Testimonial.findByIdAndUpdate(
            id,
            {
                title: title || testimonial.title,
                description: description || testimonial.description,
                rating: rating ? parseInt(rating) : testimonial.rating,
                image: image
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Testimonial updated successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    
    try {
        const testimonial = await Testimonial.findOne({ _id: id });
        if (!testimonial) {
            return res.status(404).json({ status: false, message: "Testimonial not found" });
        }

        const result = await Testimonial.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(200).json({ status: true, message: 'Testimonial deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        if (!testimonials || testimonials.length === 0) {
            return res.status(404).json({ status: false, message: "No testimonials found" });
        }

        const testimonialsList = testimonials.map(testimonial => {
            return {
                _id: testimonial._id,
                title: testimonial.title,
                description: testimonial.description,
                rating: testimonial.rating,
                imagePath: baseUrl + testimonial.image
            };
        });

        res.status(200).json({ status: true, message: 'Testimonials list.', data: testimonialsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            return res.status(404).json({ status: false, message: "Testimonial not found" });
        }

        if (testimonial.image) {
            testimonial.image = baseUrl + testimonial.image;
        }

        res.status(200).json({ status: true, message: 'Testimonial data', data: testimonial });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
