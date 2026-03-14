const Feedback = require('../models/feedbackModel');

/**
 * Create a new feedback request
 * POST /api/feedback/create
 */
exports.create = async (req, res) => {
  try {
    const { vendor_id, user_id, type, mobile_number, feedback } = req.body;

    // Validation
    if (!mobile_number || !feedback || !type) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number, feedback, and type are required'
      });
    }

    // Validate that either vendor_id or user_id is provided
    if (!vendor_id && !user_id) {
      return res.status(400).json({
        status: false,
        message: 'Either vendor_id or user_id must be provided'
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
    if (!['vendor', 'user'].includes(type)) {
      return res.status(400).json({
        status: false,
        message: 'Type must be either "vendor" or "user"'
      });
    }

    const newFeedback = new Feedback({
      vendor_id: type === 'vendor' ? vendor_id : null,
      user_id: type === 'user' ? user_id : null,
      type,
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
    if (type !== undefined) filter.type = type;

    const feedbacks = await Feedback.find(filter)
      .populate('vendor_id', 'name mobile_number email')
      .populate('user_id', 'name mobile_number email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

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
      .populate('user_id', 'name mobile_number email');

    if (!feedback) {
      return res.status(404).json({
        status: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Feedback retrieved successfully',
      data: feedback
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
      .populate('user_id', 'name mobile_number email');

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
      .populate('user_id', 'name mobile_number email')
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
 * Get feedback by user ID
 * GET /api/feedback/user/:user_id
 */
exports.findByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: 'User ID is required'
      });
    }

    const feedbacks = await Feedback.find({ user_id, isActive: true })
      .populate('vendor_id', 'name mobile_number email')
      .populate('user_id', 'name mobile_number email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Feedback.countDocuments({ user_id, isActive: true });

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No feedback found for this user'
      });
    }

    res.status(200).json({
      status: true,
      message: 'User feedback retrieved successfully',
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
