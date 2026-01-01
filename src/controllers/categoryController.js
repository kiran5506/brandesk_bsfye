const Category = require('../models/categoryModel');

exports.create = async (req, res) => {
    const { categoryName } = req.body;
    
    try {
        if (!categoryName) {
            return res.status(400).json({ status: false, message: "Category name is required" });
        }

        const newCategory = new Category({ categoryName });
        const result = await newCategory.save();
        res.status(201).json({ status: true, message: 'Category created successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Category already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { categoryName } = req.body;
    
    try {
        const category = await Category.findOne({ _id: id });
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }

        const result = await Category.findByIdAndUpdate(
            id,
            { categoryName },
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: true, message: 'Category updated successfully.', data: result });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, message: "Category already exists" });
        }
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    
    try {
        const category = await Category.findOne({ _id: id });
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }

        await Category.findByIdAndDelete(id);
        res.status(200).json({ status: true, message: 'Category deleted successfully.' });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.list = async (req, res) => {
    try {
        const categories = await Category.find().select('-createdAt -updatedAt -isActive -__v');
        if (!categories || categories.length === 0) {
            return res.status(404).json({ status: false, message: "No categories found" });
        }

        res.status(200).json({ status: true, message: 'Categories list.', data: categories });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

exports.findById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }

        res.status(200).json({ status: true, message: 'Category data', data: category });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};
