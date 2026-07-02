const Feedback = require('../models/feedbackModel');
const BusinessProfile = require('../models/businessProfileModel');

/**
 * Create a new feedback request
 * POST /api/feedback/create
 */
exports.create = async (req, res) => {
  try {
    const { vendor_id, customer_id, user_id, type, mobile_number, feedback } = req.body;
    const resolvedCustomerId = customer_id || user_id;
    const normalizedType = type === 'user' ? 'customer' : type;

    // Validation
    if (!mobile_number || !feedback || !type) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number, feedback, and type are required'
      });
    }

    // Validate that either vendor_id or customer_id is provided
    if (!vendor_id && !resolvedCustomerId) {
      return res.status(400).json({
        status: false,
        message: 'Either vendor_id or customer_id must be provided'
      });
    }

    // Validate phone number (10 digits)
    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number must be a valid 10-digit number'
      });
    }

    // Validate type
    if (!['vendor', 'customer'].includes(normalizedType)) {
      return res.status(400).json({
        status: false,
        message: 'Type must be either "vendor" or "customer"'
      });
    }

    if (normalizedType === 'vendor' && !vendor_id) {
      return res.status(400).json({
        status: false,
        message: 'vendor_id is required for vendor feedback'
      });
    }

    if (normalizedType === 'customer' && !resolvedCustomerId) {
      return res.status(400).json({
        status: false,
        message: 'customer_id is required for customer feedback'
      });
    }

    const newFeedback = new Feedback({
      vendor_id: normalizedType === 'vendor' ? vendor_id : null,
      customer_id: normalizedType === 'customer' ? resolvedCustomerId : null,
      type: normalizedType,
      mobile_number,
      feedback,
      status: 0  // Default status is 0 (pending)
    });

    const result = await newFeedback.save();

    res.status(201).json({
      status: true,
      message: 'Feedback created successfully',
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
 * Get all feedback requests
 * GET /api/feedback/list
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { isActive: true };
    if (status !== undefined) filter.status = parseInt(status);
    if (type !== undefined) {
      if (type === 'customer' || type === 'user') {
        filter.type = 'customer';
      } else {
        filter.type = type;
      }
    }

    const feedbacks = await Feedback.find(filter)
      .populate('vendor_id', 'name mobile_number email')
      .populate('customer_id', 'name mobile_number email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const vendorIds = feedbacks
      .map((item) => item.vendor_id?._id)
      .filter(Boolean);

    let businessNameByVendorId = {};
    if (vendorIds.length > 0) {
      const businessProfiles = await BusinessProfile.find({
        vendor_id: { $in: vendorIds },
        isActive: true
      })
        .select('vendor_id businessName')
        .sort({ createdAt: -1 })
        .lean();

      businessNameByVendorId = businessProfiles.reduce((acc, profile) => {
        const key = profile.vendor_id?.toString();
        if (key && !acc[key]) {
          acc[key] = profile.businessName;
        }
        return acc;
      }, {});
    }

    const enrichedFeedbacks = feedbacks.map((item) => {
      const vendorKey = item.vendor_id?._id?.toString();
      const businessName = vendorKey ? businessNameByVendorId[vendorKey] : undefined;

      if (!item.vendor_id) return item;

      return {
        ...item,
        vendor_id: {
          ...item.vendor_id,
          businessName: businessName || null
        }
      };
    });

    const total = await Feedback.countDocuments(filter);

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No feedback found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Feedback retrieved successfully',
      data: enrichedFeedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
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
 * Get feedback by ID
 * GET /api/feedback/findById/:id
 */
exports.findById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Feedback ID is required'
      });
    }

    const feedback = await Feedback.findById(id)
      .populate('vendor_id', 'name mobile_number email')
      .populate('customer_id', 'name mobile_number email')
      .lean();

    if (!feedback) {
      return res.status(404).json({
        status: false,
        message: 'Feedback not found'
      });
    }

    let enrichedFeedback = feedback;
    const vendorId = feedback.vendor_id?._id;

    if (vendorId) {
      const businessProfile = await BusinessProfile.findOne({
        vendor_id: vendorId,
        isActive: true
      })
        .select('businessName')
        .sort({ createdAt: -1 })
        .lean();

      enrichedFeedback = {
        ...feedback,
        vendor_id: {
          ...feedback.vendor_id,
          businessName: businessProfile?.businessName || null
        }
      };
    }

    res.status(200).json({
      status: true,
      message: 'Feedback retrieved successfully',
      data: enrichedFeedback
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Update feedback by ID
 * PUT /api/feedback/edit/:id
 */
exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, mobile_number } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Feedback ID is required'
      });
    }

    // Validate phone number if provided
    if (mobile_number && !/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number must be a valid 10-digit number'
      });
    }

    // Validate status if provided
    if (status !== undefined && ![0, 1].includes(status)) {
      return res.status(400).json({
        status: false,
        message: 'Status must be either 0 (pending) or 1 (resolved)'
      });
    }

    const updateData = {};
    if (feedback !== undefined) updateData.feedback = feedback;
    if (mobile_number !== undefined) updateData.mobile_number = mobile_number;
    if (status !== undefined) updateData.status = status;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vendor_id', 'name mobile_number email')
      .populate('customer_id', 'name mobile_number email');

    if (!updatedFeedback) {
      return res.status(404).json({
        status: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Delete feedback by ID (soft delete)
 * DELETE /api/feedback/delete/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Feedback ID is required'
      });
    }

    const deletedFeedback = await Feedback.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedFeedback) {
      return res.status(404).json({
        status: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Feedback deleted successfully',
      data: deletedFeedback
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Get feedback by vendor ID
 * GET /api/feedback/vendor/:vendor_id
 */
exports.findByVendorId = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!vendor_id) {
      return res.status(400).json({
        status: false,
        message: 'Vendor ID is required'
      });
    }

    const feedbacks = await Feedback.find({ vendor_id, isActive: true })
      .populate('vendor_id', 'name mobile_number email')
      .populate('customer_id', 'name mobile_number email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Feedback.countDocuments({ vendor_id, isActive: true });

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No feedback found for this vendor'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Vendor feedback retrieved successfully',
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
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
 * Get feedback by customer ID
 * GET /api/feedback/customer/:customer_id
 */
exports.findByCustomerId = async (req, res) => {
  try {
    const { customer_id, user_id } = req.params;
    const resolvedCustomerId = customer_id || user_id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!resolvedCustomerId) {
      return res.status(400).json({
        status: false,
        message: 'Customer ID is required'
      });
    }

    const customerFilter = {
      isActive: true,
      type: 'customer',
      $or: [
        { customer_id: resolvedCustomerId },
        { user_id: resolvedCustomerId }
      ]
    };

    const feedbacks = await Feedback.find(customerFilter)
      .populate('vendor_id', 'name mobile_number email')
      .populate('customer_id', 'name mobile_number email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Feedback.countDocuments(customerFilter);

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No feedback found for this customer'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Customer feedback retrieved successfully',
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
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

// Backward compatibility alias for old user route
exports.findByUserId = exports.findByCustomerId;
