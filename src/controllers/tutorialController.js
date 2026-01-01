const Tutorial = require('../models/tutorialModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    console.log(req.body);
    console.log('files-->', req.files);

    const files = req.files;
    const { title, description, language } = req.body;

    try {
        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        }

        const newTutorial = new Tutorial({
            title,
            image,
            description,
            language
        });

        const result = await newTutorial.save();
        res.status(201).json({ status: true, message: 'Tutorial created successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { title, description, language } = req.body;

    try {
        const tutorial = await Tutorial.findOne({ _id: id });
        if (!tutorial) {
            return res.status(404).json({ status: false, message: "Tutorial not found" });
        }

        let image = "";
        if (files && files.image) {
            image = files.image[0].filename;
        } else {
            image = tutorial.image;
        }

        const result = await Tutorial.findByIdAndUpdate(
            id,
            {
                title,
                image,
                description,
                language
            },
            { new: true, runValidators: true }
        );

        console.log(result);
        res.status(200).json({ status: true, message: 'Tutorial updated successfully.', data: result });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const tutorial = await Tutorial.findOne({ _id: id });
        if (!tutorial) {
            return res.status(404).json({ status: false, message: "Tutorial not found" });
        }

        await Tutorial.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Tutorial deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const tutorials = await Tutorial.find().select('-createdAt -updatedAt -isActive -__v');
        if (!tutorials || tutorials.length === 0) {
            return res.status(404).json({ status: false, message: "No tutorials found" });
        }

        const tutorialsList = tutorials.map(tutorial => {
            return {
                _id: tutorial._id,
                title: tutorial.title,
                description: tutorial.description,
                language: tutorial.language,
                imagePath: baseUrl + tutorial.image,
                isActive: tutorial.isActive,
                createdAt: tutorial.createdAt,
                updatedAt: tutorial.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Tutorials list.', data: tutorialsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const tutorial = await Tutorial.findById(id);
        if (!tutorial) {
            return res.status(404).json({ status: false, message: "Tutorial not found" });
        }

        if (tutorial.image) {
            tutorial.image = baseUrl + tutorial.image;
        }

        res.status(200).json({ status: true, message: 'Tutorial data', data: tutorial });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findByLanguage = async (req, res) => {
    const { language } = req.params;

    try {
        const tutorials = await Tutorial.find({ language });
        if (!tutorials || tutorials.length === 0) {
            return res.status(404).json({ status: false, message: "No tutorials found for this language" });
        }

        const tutorialsList = tutorials.map(tutorial => {
            return {
                _id: tutorial._id,
                title: tutorial.title,
                description: tutorial.description,
                language: tutorial.language,
                imagePath: baseUrl + tutorial.image,
                isActive: tutorial.isActive,
                createdAt: tutorial.createdAt,
                updatedAt: tutorial.updatedAt
            };
        });

        res.status(200).json({ status: true, message: 'Tutorials by language.', data: tutorialsList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
