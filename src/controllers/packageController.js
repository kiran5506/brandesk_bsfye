const Course = require('../models/courseModel');
const Package = require('../models/packageModel');
const baseUrl = process.env.BASE_URL;
const mongoose = require('mongoose');

exports.create = async (req, res) => {
    const { name, price, courseIds, description, direct_amount, passive_amount } = req.body;
    try{
        const package = await Package.findOne({name});
        if(package){
            return res.status(209).json({status:false, message: 'Package Already exist'});
        }
        const newPackage = new Package({name, price, courseIds, description, direct_amount, passive_amount});
        const result = await newPackage.save();
        res.status(201).json({status: true, message: 'Package Created Successfully.', data: result})
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}

exports.list = async (req, res) => {
    try{
        const package = await Package.find()
            .select(`name description price`)
            .sort({ createdAt: -1 });
        if (!package || package.length === 0) {
            return res.status(209).json({ status: false, message: "No package found" });
        }
        res.status(200).json({status: true, message: 'package list.', data: package})
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}

exports.findById = async (req, res) => {
    const { id } = req.params;
    try{
        const package = await Package.findOne({_id: id});
        if (!package) {
            return res.status(209).json({ status: false, message: "No package found" });
        }
        res.status(201).json({status: true, message: 'package data.', data: package})
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { name, price, courseIds, description, direct_amount, passive_amount } = req.body;
    try{
        const package = await Package.findById({_id: id});
        if(!package){
            return res.status(209).json({status:false, message: 'No package found'});
        }
        package.name = name;
        package.price = price;
        package.courseIds = courseIds;
        package.description = description;
        package.direct_amount = direct_amount;
        package.passive_amount = passive_amount;
        const result = await package.save();
        res.status(201).json({status: true, message: 'Package updated Successfully.', data: result})
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}

exports.delete = async (req, res) => {
    const { id } = req.params;
    try{
        const package = await Package.findById({_id: id});
        if(!package){
            return res.status(209).json({status:false, message: 'No package found'});
        }
        await Package.deleteOne({ _id: id });
        res.status(200).json({ status: true, message: 'Package deleted successfully.' });
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}

exports.fetchCourses = async( req, res) => {
    const { packageIds } = req.body;
    try{
        if(!packageIds && packageIds.length > 0){
            return res.status(400).json({ status: true, message: 'Package IDs are required' });
        }
        //const updatePackages = packageIds.map(id => mongoose.Types.ObjectId(id.trim()));
        const packages = await Package.find({ _id: { $in: packageIds } }).select('courseIds');
        if (!packages || packages.length === 0) {
            return res.status(404).json({ status: true, message: 'No packages found' });
        }

        const courseIds = packages.flatMap(package => package.courseIds);
        const uniqueCourseIds = [...new Set(courseIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
        console.log('uniqueCourseIds-->', uniqueCourseIds);

        const courses = await Course.find({ _id: { $in: uniqueCourseIds } }).populate('instructor', 'name description profile gender');
        if (!courses || courses.length === 0) {
            return res.status(404).json({status: true, message: 'No courses found' });
        }

        let updtedData = [];
        if(courses){
            updtedData = courses.map(course => {
                if(course.instructor && course.instructor.profile){
                    if (!course.instructor.profile.startsWith(baseUrl)) {
                        course.instructor.profile = baseUrl + course.instructor.profile;
                    }
                }
                if(course.image){
                    course.image = baseUrl + course.image;
                }
                return course;
            })
        }

        res.status(200).json({ status: true, message: 'courses data', data: updtedData });
    }catch(error){
        res.status(500).send(`An error occurred: ${error.message}`);
    }
}