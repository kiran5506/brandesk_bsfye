const ContactSupport = require('../models/contactSupportModel');

/**
 * Create a new contact support request
 * POST /api/contact-support/create
 */
exports.create = async (req, res) => {
  try {
    const { mobile_number, issue, type } = req.body;

    // Validation
    if (!mobile_number || !issue || !type) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number, issue, and type are required'
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
    if (!['customer', 'vendor'].includes(type)) {
      return res.status(400).json({
        status: false,
        message: 'Type must be either "customer" or "vendor"'
      });
    }

    const newContactSupport = new ContactSupport({
      mobile_number,
      issue,
      type,
      status: 0  // Default status is 0 (pending)
    });

    const result = await newContactSupport.save();

    res.status(201).json({
      status: true,
      message: 'Contact support request created successfully',
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
 * Get all contact support requests
 * GET /api/contact-support/list
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { isActive: true };
    if (status !== undefined) filter.status = parseInt(status);
    if (type !== undefined) filter.type = type;

    const contacts = await ContactSupport.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ContactSupport.countDocuments(filter);

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No contact support requests found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Contact support requests retrieved successfully',
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
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
 * Get contact support request by ID
 * GET /api/contact-support/findById/:id
 */
exports.findById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await ContactSupport.findOne({ 
      _id: id, 
      isActive: true 
    });

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: 'Contact support request not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Contact support request retrieved successfully',
      data: contact
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};

/**
 * Update only the status of a contact support request
 * PUT /api/contact-support/update-status/:id
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (status === undefined || status === null) {
      return res.status(400).json({
        status: false,
        message: 'Status is required'
      });
    }

    // Validate status (0 or 1)
    if (![0, 1].includes(parseInt(status))) {
      return res.status(400).json({
        status: false,
        message: 'Status must be either 0 (pending) or 1 (resolved)'
      });
    }

    const contact = await ContactSupport.findOne({ 
      _id: id, 
      isActive: true 
    });

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: 'Contact support request not found'
      });
    }

    contact.status = parseInt(status);
    const result = await contact.save();

    res.status(200).json({
      status: true,
      message: 'Status updated successfully',
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
 * Delete (soft delete) a contact support request
 * DELETE /api/contact-support/delete/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await ContactSupport.findById(id);

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: 'Contact support request not found'
      });
    }

    contact.isActive = false;
    await contact.save();

    res.status(200).json({
      status: true,
      message: 'Contact support request deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: `An error occurred: ${err.message}`
    });
  }
};
