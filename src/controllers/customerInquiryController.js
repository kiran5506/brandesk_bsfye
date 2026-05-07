const CustomerInquiry = require('../models/customerInquiryModel');
const Customer = require('../models/customerModel');
const Service = require('../models/serviceModel');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const LeadPackage = require('../models/leadPackageModel');
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
  business_profile_id,
  package_id,
  skip_otp,
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

    const shouldSkipOtp = Boolean(skip_otp);
    const otp = shouldSkipOtp ? undefined : Math.floor(1000 + Math.random() * 9000).toString();
    const newInquiry = new CustomerInquiry({
      customer_id: customer._id,
      enquiry_type: resolvedEnquiryType,
      city_id: city_id && mongoose.Types.ObjectId.isValid(city_id) ? city_id : undefined,
      city_name: city && (!city_id || !mongoose.Types.ObjectId.isValid(city_id)) ? city : undefined,
      enquiry_date: resolvedEventDate ? new Date(resolvedEventDate) : undefined,
      service_id: service_id && mongoose.Types.ObjectId.isValid(service_id) ? service_id : undefined,
  business_profile_id: business_profile_id && mongoose.Types.ObjectId.isValid(business_profile_id) ? business_profile_id : undefined,
      package_id: package_id && mongoose.Types.ObjectId.isValid(package_id) ? package_id : undefined,
      OTP: otp,
      is_verified: shouldSkipOtp
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

/**
 * Get customer inquiries/callbacks with profile/package enrichment
 * GET /api/inquiry/customer/list
 */
exports.listByCustomer = async (req, res) => {
  try {
    const {
      customer_id,
      enquiry_type,
      service_name,
      enquiry_date,
      page = 1,
      limit = 20
    } = req.query;

    if (!customer_id || !mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({
        status: false,
        message: 'Valid customer_id is required'
      });
    }

    const filter = {
      isActive: true,
      customer_id: new mongoose.Types.ObjectId(customer_id)
    };

    if (enquiry_type && ['enquiry', 'callback'].includes(enquiry_type)) {
      filter.enquiry_type = enquiry_type;
    }

    if (enquiry_date) {
      const parsedDate = new Date(enquiry_date);
      if (!Number.isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);
        filter.enquiry_date = { $gte: start, $lte: end };
      }
    }

    if (service_name && String(service_name).trim()) {
      const matchingServices = await Service.find({
        isActive: true,
        serviceName: { $regex: String(service_name).trim(), $options: 'i' }
      }).select('_id').lean();

      if (!matchingServices.length) {
        return res.status(200).json({
          status: true,
          message: 'Customer inquiries retrieved successfully',
          data: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0
          }
        });
      }

      filter.service_id = { $in: matchingServices.map((service) => service._id) };
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (parsedPage - 1) * parsedLimit;

    const [inquiries, total] = await Promise.all([
      CustomerInquiry.find(filter)
        .populate('service_id', 'serviceName image')
        .sort({ enquiry_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      CustomerInquiry.countDocuments(filter)
    ]);

    if (!inquiries.length) {
      return res.status(200).json({
        status: true,
        message: 'Customer inquiries retrieved successfully',
        data: [],
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit)
        }
      });
    }

    const directProfileIds = inquiries
      .map((item) => item.business_profile_id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const packageIds = inquiries
      .map((item) => item.package_id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const [directProfiles, businessPackages, leadPackages] = await Promise.all([
      directProfileIds.length
        ? BusinessProfile.find({ _id: { $in: directProfileIds }, isActive: true })
            .select('_id businessName profilePicture service_id vendor_id')
            .lean()
        : Promise.resolve([]),
      packageIds.length
        ? BusinessPackage.find({ _id: { $in: packageIds }, isActive: true })
            .select('_id packageName coverImage vendor_id service_id')
            .lean()
        : Promise.resolve([]),
      packageIds.length
        ? LeadPackage.find({ _id: { $in: packageIds }, isActive: true })
            .select('_id packageName image')
            .lean()
        : Promise.resolve([])
    ]);

    const directProfileMap = new Map(directProfiles.map((item) => [String(item._id), item]));
    const businessPackageMap = new Map(businessPackages.map((item) => [String(item._id), item]));
    const leadPackageMap = new Map(leadPackages.map((item) => [String(item._id), item]));

    const profileLookupPairs = businessPackages
      .map((pkg) => ({
        vendor_id: pkg.vendor_id ? String(pkg.vendor_id) : '',
        service_id: pkg.service_id ? String(pkg.service_id) : ''
      }))
      .filter((pair) => pair.vendor_id && pair.service_id);

    const uniquePairKeys = [...new Set(profileLookupPairs.map((pair) => `${pair.vendor_id}::${pair.service_id}`))];
    const profilePairOrQuery = uniquePairKeys.map((key) => {
      const [vendorId, serviceId] = key.split('::');
      return {
        vendor_id: new mongoose.Types.ObjectId(vendorId),
        service_id: new mongoose.Types.ObjectId(serviceId),
        isActive: true
      };
    });

    const packageMappedProfiles = profilePairOrQuery.length
      ? await BusinessProfile.find({ $or: profilePairOrQuery })
          .select('_id businessName profilePicture service_id vendor_id')
          .lean()
      : [];

    const packageProfileMap = new Map(
      packageMappedProfiles.map((profile) => [
        `${String(profile.vendor_id)}::${String(profile.service_id)}`,
        profile
      ])
    );

    const fallbackServiceIds = inquiries
      .map((item) => item.service_id?._id || item.service_id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const fallbackProfiles = fallbackServiceIds.length
      ? await BusinessProfile.find({
          service_id: { $in: fallbackServiceIds },
          isActive: true
        })
          .sort({ createdAt: -1 })
          .select('_id businessName profilePicture service_id vendor_id')
          .lean()
      : [];

    const fallbackProfileMap = new Map();
    fallbackProfiles.forEach((profile) => {
      const key = String(profile.service_id);
      if (!fallbackProfileMap.has(key)) {
        fallbackProfileMap.set(key, profile);
      }
    });

    const rows = inquiries.map((inquiry) => {
      const inquiryService = inquiry.service_id || {};
      const inquiryServiceId = String(inquiryService?._id || inquiry.service_id || '');
      const inquiryPackageId = String(inquiry.package_id || '');
      const inquiryBusinessProfileId = String(inquiry.business_profile_id || '');

      const businessPackage = businessPackageMap.get(inquiryPackageId) || null;
      const leadPackage = leadPackageMap.get(inquiryPackageId) || null;

      let businessProfile = null;
      if (inquiryBusinessProfileId && directProfileMap.has(inquiryBusinessProfileId)) {
        businessProfile = directProfileMap.get(inquiryBusinessProfileId);
      } else if (businessPackage?.vendor_id && businessPackage?.service_id) {
        const pairKey = `${String(businessPackage.vendor_id)}::${String(businessPackage.service_id)}`;
        businessProfile = packageProfileMap.get(pairKey) || null;
      } else if (inquiryServiceId && fallbackProfileMap.has(inquiryServiceId)) {
        businessProfile = fallbackProfileMap.get(inquiryServiceId);
      }

      return {
        _id: inquiry._id,
        customer_id: inquiry.customer_id,
        enquiry_type: inquiry.enquiry_type,
        city_id: inquiry.city_id,
        city_name: inquiry.city_name,
        enquiry_date: inquiry.enquiry_date || inquiry.createdAt,
        is_verified: inquiry.is_verified,
        createdAt: inquiry.createdAt,
        service: {
          _id: inquiryService?._id || null,
          name: inquiryService?.serviceName || 'Service',
          image: inquiryService?.image || ''
        },
        business_profile: businessProfile
          ? {
              _id: businessProfile._id,
              businessName: businessProfile.businessName,
              profilePicture: businessProfile.profilePicture || ''
            }
          : null,
        package: inquiry.enquiry_type === 'callback'
          ? {
              _id: businessPackage?._id || leadPackage?._id || null,
              packageName: businessPackage?.packageName || leadPackage?.packageName || '',
              image: businessPackage?.coverImage || leadPackage?.image || ''
            }
          : null
      };
    });

    return res.status(200).json({
      status: true,
      message: 'Customer inquiries retrieved successfully',
      data: rows,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

