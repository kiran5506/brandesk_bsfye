const Blog = require('../models/blogModel');
const baseUrl = process.env.BASE_URL;

exports.create = async (req, res) => {
    const files = req.files;
    const { title, shortDescription, content } = req.body;

    try {
        if (!title || !shortDescription || !content) {
            return res.status(400).json({ status: false, message: "Title, short description, and content are required" });
        }

        let image = "";
        if (files && files.image && files.image[0]) {
            image = files.image[0].key;
        }

        if (!image) {
            return res.status(400).json({ status: false, message: "Cover image is required" });
        }

        const newBlog = new Blog({ title, shortDescription, content, image });
        await newBlog.save();

        res.status(201).json({ status: true, message: 'Blog created successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const files = req.files;
    const { id } = req.params;
    const { title, shortDescription, content, isActive } = req.body;

    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ status: false, message: "Blog not found" });
        }

        let image = blog.image;
        if (files && files.image && files.image[0]) {
            image = files.image[0].key;
        }

        const updated = await Blog.findByIdAndUpdate(
            id,
            {
                title: title || blog.title,
                shortDescription: shortDescription || blog.shortDescription,
                content: content || blog.content,
                image,
                isActive: isActive !== undefined ? isActive === 'true' || isActive === true : blog.isActive
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Blog updated successfully.', data: updated });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ status: false, message: "Blog not found" });
        }

        await Blog.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Blog deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const blogs = await Blog.find({ isActive: true }).sort({ _id: -1 });
        if (!blogs || blogs.length === 0) {
            return res.status(404).json({ status: false, message: "No blogs found" });
        }

        const blogList = blogs.map(blog => ({
            _id: blog._id,
            title: blog.title,
            shortDescription: blog.shortDescription,
            content: blog.content,
            imagePath: baseUrl + blog.image,
            isActive: blog.isActive,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        }));

        res.status(200).json({ status: true, message: 'Blogs list.', data: blogList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.adminList = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ _id: -1 });
        if (!blogs || blogs.length === 0) {
            return res.status(404).json({ status: false, message: "No blogs found" });
        }

        const blogList = blogs.map(blog => ({
            _id: blog._id,
            title: blog.title,
            shortDescription: blog.shortDescription,
            content: blog.content,
            imagePath: baseUrl + blog.image,
            isActive: blog.isActive,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        }));

        res.status(200).json({ status: true, message: 'Blogs list.', data: blogList });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ status: false, message: "Blog not found" });
        }

        const blogData = {
            _id: blog._id,
            title: blog.title,
            shortDescription: blog.shortDescription,
            content: blog.content,
            imagePath: baseUrl + blog.image,
            isActive: blog.isActive,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        };

        res.status(200).json({ status: true, message: 'Blog data', data: blogData });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
