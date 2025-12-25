const Vendor = require("../models/vendorModule");

exports.edit = async (req, res) => {    
    const { id } = req.params;
    const { name, mobile_number, email } = req.body;
    try{
        const vendorData = await Vendor.findOne({_id: id});
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        const result = await Vendor.findByIdAndUpdate(id, {name, mobile_number, email}, { new: true, runValidators: true });
        console.log(result);
        
        res.status(201).json({status: true, message: 'Vendor updated Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.delete = async (req, res) => {
    const { id } = req.params;
    try{
        const vendorData = await Vendor.findOne({_id: id});
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        const result = await Vendor.findByIdAndDelete(id, { new: true, runValidators: true });
        res.status(201).json({status: true, message: 'Vendor Deleted Successfully.'})
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.list = async (req, res) => {
    try{
        const vendorList = await Vendor.find({}, '-password -__v').sort({ createdAt: -1 });
        res.status(200).json({status: true, data: vendorList});

    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}

exports.view = async (req, res) => {
    const { id } = req.params;
    try{
        const vendorData = await Vendor.findOne({_id: id}, '-password -__v');
        if(!vendorData){
            return res.status(404).json({ status: false, message: "Vendor data not found" });
        }
        res.status(200).json({status: true, data: vendorData});
    }catch(err){
        res.status(500).send(`An error occurred: ${err.message}`);
    }
}