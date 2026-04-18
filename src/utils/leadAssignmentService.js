const BusinessProfile = require('../models/businessProfileModel');
const Vendor = require('../models/vendorModule');
const Review = require('../models/reviewModel');
const Payment = require('../models/paymentModel');
const City = require('../models/cityModel');
const LeadAssignment = require('../models/leadAssignmentModel');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCityName = async (inquiry) => {
  if (inquiry.city_name) return inquiry.city_name;
  if (!inquiry.city_id) return '';
  const cityDoc = await City.findById(inquiry.city_id).lean();
  return cityDoc?.cityName || '';
};

const buildVendorMetrics = ({ vendors, paymentMap, ratingMap, lastAssignedMap, previousAssignedSet }) => {
  return vendors.map((vendor) => {
    const vendorId = String(vendor._id);
    return {
      ...vendor,
      packageAmount: paymentMap[vendorId] || 0,
      avgRating: ratingMap[vendorId]?.avgRating || 0,
      ratingCount: ratingMap[vendorId]?.totalReviews || 0,
      lastAssignedAt: lastAssignedMap[vendorId] || null,
      isPreviouslyAssigned: previousAssignedSet.has(vendorId)
    };
  });
};

const sortVendorsForLead = (a, b) => {
  if (a.isPreviouslyAssigned !== b.isPreviouslyAssigned) {
    return a.isPreviouslyAssigned ? 1 : -1;
  }
  if (b.packageAmount !== a.packageAmount) {
    return b.packageAmount - a.packageAmount;
  }
  if (b.avgRating !== a.avgRating) {
    return b.avgRating - a.avgRating;
  }
  const approvedA = a.approved_date ? new Date(a.approved_date).getTime() : 0;
  const approvedB = b.approved_date ? new Date(b.approved_date).getTime() : 0;
  if (approvedB !== approvedA) {
    return approvedB - approvedA;
  }
  const lastAssignedA = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
  const lastAssignedB = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
  return lastAssignedA - lastAssignedB;
};

const assignVendorsToInquiry = async (inquiry, { limit = 5 } = {}) => {
  const cityName = await getCityName(inquiry);
  const profileQuery = { isActive: true };

  if (inquiry.service_id) {
    profileQuery.service_id = inquiry.service_id;
  }

  if (cityName) {
    profileQuery['address.city'] = new RegExp(`^${escapeRegex(cityName)}$`, 'i');
  }

  let vendorIds = await BusinessProfile.distinct('vendor_id', profileQuery);
  const previousAssignedVendorIds = await LeadAssignment.distinct('vendor_id', {
    customer_id: inquiry.customer_id,
    service_id: inquiry.service_id,
    isActive: true
  });

  if (!vendorIds.length && previousAssignedVendorIds.length) {
    vendorIds = previousAssignedVendorIds;
  }

  if (!vendorIds.length) return [];

  let vendors = await Vendor.find({
    _id: { $in: vendorIds },
    isActive: true,
    profile_status: 'accepted'
  }).lean();

  if (!vendors.length) {
    vendors = await Vendor.find({ _id: { $in: vendorIds }, isActive: true }).lean();
  }

  if (!vendors.length) return [];

  const vendorIdList = vendors.map((vendor) => vendor._id);

  const payments = await Payment.aggregate([
    { $match: { vendor_id: { $in: vendorIdList }, status: 'paid' } },
    { $group: { _id: '$vendor_id', maxAmount: { $max: '$amount' } } }
  ]);

  const ratings = await Review.aggregate([
    { $match: { vendor_id: { $in: vendorIdList }, isActive: true, status: 'accepted' } },
    { $group: { _id: '$vendor_id', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);

  const lastAssignments = await LeadAssignment.aggregate([
    { $match: { vendor_id: { $in: vendorIdList }, isActive: true } },
    { $group: { _id: '$vendor_id', lastAssignedAt: { $max: '$assigned_at' } } }
  ]);

  const paymentMap = payments.reduce((acc, entry) => {
    acc[String(entry._id)] = entry.maxAmount || 0;
    return acc;
  }, {});

  const ratingMap = ratings.reduce((acc, entry) => {
    acc[String(entry._id)] = {
      avgRating: entry.avgRating || 0,
      totalReviews: entry.totalReviews || 0
    };
    return acc;
  }, {});

  const lastAssignedMap = lastAssignments.reduce((acc, entry) => {
    acc[String(entry._id)] = entry.lastAssignedAt || null;
    return acc;
  }, {});

  const previousAssignedSet = new Set(previousAssignedVendorIds.map((id) => String(id)));

  const vendorMetrics = buildVendorMetrics({
    vendors,
    paymentMap,
    ratingMap,
    lastAssignedMap,
    previousAssignedSet
  }).sort(sortVendorsForLead);

  const selected = vendorMetrics.slice(0, limit);
  if (!selected.length) return [];

  const now = new Date();
  const assignments = selected.map((vendor) => ({
    inquiry_id: inquiry._id,
    vendor_id: vendor._id,
    customer_id: inquiry.customer_id,
    service_id: inquiry.service_id,
    city_name: cityName,
    assigned_at: now,
    last_assigned_at: now,
    status: 'assigned',
    credits_deducted: false,
    isActive: true
  }));

  try {
    await LeadAssignment.insertMany(assignments, { ordered: false });
  } catch (err) {
    // Ignore duplicate assignment errors for idempotency
  }

  return assignments;
};

module.exports = {
  assignVendorsToInquiry
};
