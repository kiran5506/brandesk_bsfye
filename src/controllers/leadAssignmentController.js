const LeadAssignment = require('../models/leadAssignmentModel');
const Vendor = require('../models/vendorModule');
const LeadReplacementRequest = require('../models/leadReplacementRequestModel');
const CustomerInquiry = require('../models/customerInquiryModel');
const Customer = require('../models/customerModel');

exports.listByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.query;

    if (!vendorId) {
      return res.status(400).json({ status: false, message: 'vendorId is required' });
    }

    const filter = { vendor_id: vendorId, isActive: true };
    if (status) filter.status = status;

    const assignments = await LeadAssignment.find(filter)
      .populate('customer_id', 'name mobile_number')
      .populate('service_id', 'serviceName')
      .populate('inquiry_id', 'enquiry_date city_name')
      .sort({ assigned_at: -1 });

    const counts = assignments.reduce(
      (acc, assignment) => {
        acc.total += 1;
        acc[assignment.status] = (acc[assignment.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );

    res.status(200).json({
      status: true,
      message: 'Lead assignments retrieved successfully',
      data: { assignments, counts }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendor_id, status } = req.body;

    if (!id || !vendor_id || !status) {
      return res.status(400).json({ status: false, message: 'id, vendor_id and status are required' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ status: false, message: 'Invalid status' });
    }

    const assignment = await LeadAssignment.findOne({ _id: id, vendor_id, isActive: true });
    if (!assignment) {
      return res.status(404).json({ status: false, message: 'Lead assignment not found' });
    }

    assignment.status = status;
    assignment.responded_at = new Date();
    await assignment.save();

    res.status(200).json({
      status: true,
      message: `Lead ${status}`,
      data: assignment
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.requestReplacement = async (req, res) => {
  try {
    const { assignment_id, vendor_id, reason } = req.body;

    if (!assignment_id || !vendor_id || !reason) {
      return res.status(400).json({ status: false, message: 'assignment_id, vendor_id and reason are required' });
    }

    const assignment = await LeadAssignment.findOne({ _id: assignment_id, vendor_id, isActive: true });
    if (!assignment) {
      return res.status(404).json({ status: false, message: 'Lead assignment not found' });
    }

    const replacementRequest = await LeadReplacementRequest.findOneAndUpdate(
      { assignment_id, vendor_id },
      { reason, status: 'pending' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    assignment.status = 'replace_requested';
    assignment.replacement_requested_at = new Date();
    await assignment.save();

    res.status(200).json({
      status: true,
      message: 'Replacement request submitted',
      data: replacementRequest
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.reviewReplacement = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_id } = req.body;

    if (!id || !status) {
      return res.status(400).json({ status: false, message: 'id and status are required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ status: false, message: 'Invalid status' });
    }

    const request = await LeadReplacementRequest.findById(id);
    if (!request) {
      return res.status(404).json({ status: false, message: 'Replacement request not found' });
    }

    request.status = status;
    request.reviewed_by = admin_id || request.reviewed_by;
    request.reviewed_at = new Date();
    await request.save();

    const assignment = await LeadAssignment.findById(request.assignment_id);
    if (assignment) {
      assignment.status = status === 'approved' ? 'replaced' : 'rejected';
      assignment.responded_at = new Date();
      await assignment.save();
    }

    if (status === 'approved') {
      const vendorId = request.vendor_id || assignment?.vendor_id;
      if (vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
          vendor.credits = Number(vendor.credits || 0) + 1;
          await vendor.save();
        }
      }
    }

    res.status(200).json({
      status: true,
      message: `Replacement request ${status}`,
      data: request
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.listAdminLeads = async (req, res) => {
  try {
    const { search = '', date } = req.query;
    const inquiryMatch = { isActive: true };
    const searchValue = String(search).trim();

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      inquiryMatch.$or = [
        { enquiry_date: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } }
      ];
    }

    if (searchValue) {
      const regex = new RegExp(searchValue, 'i');
      const customers = await Customer.find({
        $or: [{ name: regex }, { mobile_number: regex }]
      }).select('_id');
      const customerIds = customers.map((customer) => customer._id);
      const searchFilters = [{ city_name: regex }];
      if (customerIds.length) {
        searchFilters.push({ customer_id: { $in: customerIds } });
      }
      inquiryMatch.$or = inquiryMatch.$or ? inquiryMatch.$or.concat(searchFilters) : searchFilters;
    }

    const inquiries = await CustomerInquiry.find(inquiryMatch)
      .sort({ createdAt: -1 })
      .lean();

    if (!inquiries.length) {
      return res.status(200).json({ status: true, message: 'No leads found', data: [] });
    }

    const inquiryIds = inquiries.map((inquiry) => inquiry._id);
    const customerIds = inquiries.map((inquiry) => inquiry.customer_id);

    const assignments = await LeadAssignment.aggregate([
      { $match: { inquiry_id: { $in: inquiryIds }, isActive: true } },
      {
        $group: {
          _id: '$inquiry_id',
          vendorCount: { $sum: 1 },
          vendorIds: { $addToSet: '$vendor_id' }
        }
      }
    ]);

    const assignmentMap = assignments.reduce((acc, entry) => {
      acc[String(entry._id)] = entry;
      return acc;
    }, {});

    const customers = await Customer.find({ _id: { $in: customerIds } })
      .select('name mobile_number')
      .lean();
    const customerMap = customers.reduce((acc, customer) => {
      acc[String(customer._id)] = customer;
      return acc;
    }, {});

    const leadRows = inquiries.map((inquiry) => {
      const assignmentInfo = assignmentMap[String(inquiry._id)] || { vendorCount: 0 };
      const customer = customerMap[String(inquiry.customer_id)] || {};
      return {
        inquiry_id: inquiry._id,
        enquiry_date: inquiry.enquiry_date || inquiry.createdAt,
        customer_name: customer.name || 'N/A',
        customer_mobile: customer.mobile_number || 'N/A',
        city_name: inquiry.city_name || 'N/A',
        vendors: assignmentInfo.vendorCount || 0
      };
    });

    res.status(200).json({
      status: true,
      message: 'Leads retrieved successfully',
      data: leadRows
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.listReplacementRequests = async (req, res) => {
  try {
    const requests = await LeadReplacementRequest.find()
      .populate({
        path: 'assignment_id',
        populate: [
          { path: 'inquiry_id', select: 'enquiry_date city_name customer_id' },
          { path: 'vendor_id', select: 'name mobile_number' }
        ]
      })
      .populate('vendor_id', 'name mobile_number')
      .sort({ createdAt: -1 })
      .lean();

    if (!requests.length) {
      return res.status(200).json({ status: true, message: 'No replacement requests found', data: [] });
    }

    const inquiryIds = requests
      .map((request) => request.assignment_id?.inquiry_id)
      .filter(Boolean);
    const customerIds = inquiryIds
      .map((inquiry) => inquiry.customer_id)
      .filter(Boolean);

    const customers = await Customer.find({ _id: { $in: customerIds } })
      .select('name mobile_number')
      .lean();
    const customerMap = customers.reduce((acc, customer) => {
      acc[String(customer._id)] = customer;
      return acc;
    }, {});

    const payload = requests.map((request) => {
      const assignment = request.assignment_id || {};
      const inquiry = assignment.inquiry_id || {};
      const customer = customerMap[String(inquiry.customer_id)] || {};
      const vendor = assignment.vendor_id || request.vendor_id || {};

      return {
        request_id: request._id,
        date: request.createdAt || null,
        customer_name: customer.name || 'N/A',
        customer_mobile: customer.mobile_number || 'N/A',
        city_name: inquiry.city_name || 'N/A',
        vendor_name: vendor.name || 'N/A',
        status: request.status || 'pending'
      };
    });

    res.status(200).json({
      status: true,
      message: 'Replacement requests retrieved successfully',
      data: payload
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.getReplacementRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeadReplacementRequest.findById(id)
      .populate({
        path: 'assignment_id',
        populate: [
          { path: 'inquiry_id', select: 'enquiry_date city_name customer_id service_id' },
          { path: 'vendor_id', select: 'name mobile_number' }
        ]
      })
      .populate('vendor_id', 'name mobile_number')
      .lean();

    if (!request) {
      return res.status(404).json({ status: false, message: 'Replacement request not found' });
    }

    const inquiry = request.assignment_id?.inquiry_id;
    const customer = inquiry?.customer_id
      ? await Customer.findById(inquiry.customer_id).select('name mobile_number').lean()
      : null;

    res.status(200).json({
      status: true,
      message: 'Replacement request retrieved successfully',
      data: {
        request,
        inquiry,
        customer,
        vendor: request.assignment_id?.vendor_id || request.vendor_id
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.getAdminLeadDetails = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const inquiry = await CustomerInquiry.findById(inquiryId)
      .populate('service_id', 'serviceName')
      .lean();
    if (!inquiry) {
      return res.status(404).json({ status: false, message: 'Lead not found' });
    }

    const customer = await Customer.findById(inquiry.customer_id)
      .select('name mobile_number')
      .lean();

    const assignments = await LeadAssignment.find({ inquiry_id: inquiryId, isActive: true })
      .populate('vendor_id', 'name mobile_number email')
      .sort({ assigned_at: -1 })
      .lean();

    res.status(200).json({
      status: true,
      message: 'Lead details retrieved successfully',
      data: {
        inquiry,
        customer,
        assignments
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};

exports.markViewed = async (req, res) => {
  try {
    const { assignment_id, vendor_id } = req.body;

    if (!assignment_id || !vendor_id) {
      return res.status(400).json({ status: false, message: 'assignment_id and vendor_id are required' });
    }

    const assignment = await LeadAssignment.findOne({
      _id: assignment_id,
      vendor_id,
      isActive: true
    });

    if (!assignment) {
      return res.status(404).json({ status: false, message: 'Lead assignment not found' });
    }

    if (!assignment.credits_deducted) {
      const vendor = await Vendor.findById(vendor_id);
      if (!vendor) {
        return res.status(404).json({ status: false, message: 'Vendor not found' });
      }
      if (Number(vendor.credits) <= 0) {
        return res.status(400).json({ status: false, message: 'Insufficient credits to view this lead' });
      }

      vendor.credits = Number(vendor.credits) - 1;
      await vendor.save();

      assignment.credits_deducted = true;
      assignment.status = 'viewed';
      assignment.viewed_at = new Date();
      await assignment.save();

      return res.status(200).json({
        status: true,
        message: 'Lead viewed and credits deducted',
        data: { assignment, vendorCredits: vendor.credits }
      });
    }

    res.status(200).json({
      status: true,
      message: 'Lead already viewed',
      data: { assignment }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: `An error occurred: ${err.message}` });
  }
};
