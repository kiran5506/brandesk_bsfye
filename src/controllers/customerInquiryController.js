const CustomerInquiry = require('../models/customerInquiryModel');
const Customer = require('../models/customerModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { assignVendorsToInquiry } = require('../utils/leadAssignmentService');

/**
 * Create a new customer inquiry
 * POST /api/inquiry/create
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      customer_name,
      mobile_number,
      customer_mobile,
      city_id,
      city,
      service_id,
      event_date,
      enquiry_date,
      enquiry_type
    } = req.body;

    const resolvedName = name || customer_name;
    const resolvedMobile = mobile_number || customer_mobile;
    const resolvedEventDate = event_date || enquiry_date;
    const resolvedEnquiryType = enquiry_type || 'callback';

    // Validation
    if (!resolvedName || !resolvedMobile || !resolvedEventDate) {
      return res.status(400).json({
        status: false,
        message: 'All fields are required'
      });
    }

    // Validate phone number (10 digits)
    if (!/^[0-9]{10}$/.test(resolvedMobile)) {
      return res.status(400).json({
        status: false,
        message: 'Customer mobile must be a valid 10-digit number'
      });
    }

    if (!['callback', 'enquiry'].includes(resolvedEnquiryType)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid enquiry type'
      });
    }

    let customer = await Customer.findOne({ mobile_number: resolvedMobile });

    if (!customer) {
      // const randomPassword = crypto
      //   .randomBytes(6)
      //   .toString('base64')
      //   .replace(/[^a-zA-Z0-9]/g, '')
      //   .slice(0, 10);
      const randomPassword = '123456';
      const hashedPassword = await bcrypt.hash(String(randomPassword), 10);
      const generatedEmail = `${resolvedMobile}@bsfye.com`;

      const newCustomer = new Customer({
        name: resolvedName,
        mobile_number: resolvedMobile,
        email: generatedEmail,
        password: hashedPassword,
        type: 'callback',
        isActive: true
      });

      customer = await newCustomer.save();
    }

    const inquiryFilter = {
      customer_id: customer._id,
      enquiry_type: resolvedEnquiryType,
      isActive: true
    };

    const existingInquiry = await CustomerInquiry.findOne(inquiryFilter);

    if (existingInquiry) {
      return res.status(400).json({
        status: false,
        message: 'An inquiry already exists for this mobile number'
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const newInquiry = new CustomerInquiry({
      customer_id: customer._id,
      enquiry_type: resolvedEnquiryType,
      city_id: city_id && mongoose.Types.ObjectId.isValid(city_id) ? city_id : undefined,
      city_name: city && (!city_id || !mongoose.Types.ObjectId.isValid(city_id)) ? city : undefined,
      enquiry_date: resolvedEventDate ? new Date(resolvedEventDate) : undefined,
      service_id: service_id && mongoose.Types.ObjectId.isValid(service_id) ? service_id : undefined,
      OTP: otp,
      is_verified: false
    });

    const result = await newInquiry.save();

  await assignVendorsToInquiry(result, { limit: 5 });

    res.status(201).json({
      status: true,
      message: 'Customer inquiry created successfully',
      data: result
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Get all customer inquiries
 * GET /api/inquiry/list
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, is_verified } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { isActive: true };
    if (is_verified !== undefined) filter.is_verified = is_verified === 'true';

    const inquiries = await CustomerInquiry.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CustomerInquiry.countDocuments(filter);

    if (!inquiries || inquiries.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No customer inquiries found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Customer inquiries retrieved successfully',
      data: inquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Get customer inquiry by ID
 * GET /api/inquiry/findById/:id
 */
exports.findById = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await CustomerInquiry.findOne({
      _id: id,
      isActive: true
    });

    if (!inquiry) {
      return res.status(404).json({
        status: false,
        message: 'Customer inquiry not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Customer inquiry retrieved successfully',
      data: inquiry
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Update customer inquiry OTP and verification
 * PUT /api/inquiry/updateStatus/:id
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { OTP, is_verified } = req.body;

    const inquiry = await CustomerInquiry.findOne({
      _id: id,
      isActive: true
    });

    if (!inquiry) {
      return res.status(404).json({
        status: false,
        message: 'Customer inquiry not found'
      });
    }

    // Update the inquiry
    const updateData = {};
    if (OTP !== undefined) updateData.OTP = OTP;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const updatedInquiry = await CustomerInquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: 'Customer inquiry updated successfully',
      data: updatedInquiry
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Update entire customer inquiry
 * PUT /api/inquiry/update/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_mobile, city, event_date, OTP, is_verified } = req.body;

    const inquiry = await CustomerInquiry.findOne({
      _id: id,
      isActive: true
    });

    if (!inquiry) {
      return res.status(404).json({
        status: false,
        message: 'Customer inquiry not found'
      });
    }

    // Validate phone number if provided
    if (customer_mobile && !/^[0-9]{10}$/.test(customer_mobile)) {
      return res.status(400).json({
        status: false,
        message: 'Customer mobile must be a valid 10-digit number'
      });
    }

    const updateData = {};
    if (customer_name) updateData.customer_name = customer_name;
    if (customer_mobile) updateData.customer_mobile = customer_mobile;
    if (city) updateData.city = city;
    if (event_date) updateData.event_date = new Date(event_date);
    if (OTP !== undefined) updateData.OTP = OTP;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const updatedInquiry = await CustomerInquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: true,
      message: 'Customer inquiry updated successfully',
      data: updatedInquiry
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Delete/Deactivate customer inquiry
 * DELETE /api/inquiry/delete/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await CustomerInquiry.findOne({
      _id: id,
      isActive: true
    });

    if (!inquiry) {
      return res.status(404).json({
        status: false,
        message: 'Customer inquiry not found'
      });
    }

    // Soft delete - deactivate instead of hard delete
    await CustomerInquiry.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: 'Customer inquiry deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};


exports.verifyOtp = async (req, res) => {
    const { inquiry_id, otp_code } = req.body;
    try {
    const inquiry = await CustomerInquiry.findById(inquiry_id);
        if (!inquiry) {
            return res.status(404).json({ status: false, message: "Inquiry not found" });
        }
    if (inquiry.is_verified) {
      return res.status(400).json({ status: false, message: "Inquiry already verified" });
    }
    if (!inquiry.OTP || inquiry.OTP !== otp_code) {
            return res.status(400).json({ status: false, message: "Invalid OTP" });
        }
        inquiry.is_verified = true;
        inquiry.OTP = undefined;
        await inquiry.save();

        res.status(200).json({ status: true, message: "OTP verified successfully", data: inquiry });
    } catch (err) {
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};

