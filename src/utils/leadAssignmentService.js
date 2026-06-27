const mongoose = require('mongoose');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const Vendor = require('../models/vendorModule');
const Review = require('../models/reviewModel');
const City = require('../models/cityModel');
const LeadAssignment = require('../models/leadAssignmentModel');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolve city_id and cityName from the inquiry.
 */
const getCityInfo = async (inquiry) => {
  if (inquiry.city_id) {
    const cityDoc = await City.findById(inquiry.city_id).lean();
    return {
      cityId: inquiry.city_id,
      cityName: cityDoc?.cityName || inquiry.city_name || ''
    };
  }
  if (inquiry.city_name) {
    const cityDoc = await City.findOne({
      cityName: new RegExp(`^${escapeRegex(inquiry.city_name)}$`, 'i')
    }).lean();
    return {
      cityId: cityDoc?._id || null,
      cityName: inquiry.city_name
    };
  }
  return { cityId: null, cityName: '' };
};

/**
 * Deduct 1 credit from a vendor and mark the assignment as credits_deducted.
 * Re-reads the vendor to get the latest credit count. Safe when credits = 0.
 */
const deductCreditForAssignment = async (vendorId, inquiryId) => {
  const vendor = await Vendor.findById(vendorId).lean();
  if (vendor && Number(vendor.credits) > 0) {
    await Vendor.findByIdAndUpdate(vendorId, { $inc: { credits: -1 } });
    await LeadAssignment.updateOne(
      { inquiry_id: inquiryId, vendor_id: vendorId },
      { $set: { credits_deducted: true } }
    );
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CALLBACK  (package_id is present on the inquiry)
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Load the BusinessPackage → get vendor_id + service_id.
 *  2. Find the matching BusinessProfile for that vendor (no city check — the
 *     customer was already on this vendor's service-details page).
 *  3. Gate on Vendor.isActive + profile_status from the Vendor table.
 *  4. Create ONE LeadAssignment record and deduct 1 credit.
 *
 *  Multiple-package scenario:
 *    • Vendor has 4 packages.  Customer raises a separate callback per package
 *      → 4 different CustomerInquiry records (different package_id each time)
 *      → 4 different LeadAssignment records → shows 4 rows in "Callback Requests".
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ENQUIRY  (service-page enquiry, no package_id)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Selection criteria (from Vendor + BusinessProfile together):
 *    • BusinessProfile.isActive = true
 *    • BusinessProfile.selectedCities contains inquiry.city_id  ← primary
 *    • BusinessProfile.service_id = inquiry.service_id
 *    • Vendor.isActive = true
 *    • Vendor.profile_status = 'accepted'
 *    • Vendor.credits > 0
 *
 *  Sorting (stable, computed on the FULL eligible pool):
 *    avgRating DESC  →  credits DESC
 *
 *  Rotation (global, across ALL customers for this service+city):
 *    • Vendors already sent at least one enquiry → "used" set.
 *    • Always pick the NEXT `limit` vendors from the sorted list who are NOT
 *      yet in the "used" set.
 *    • If fewer than `limit` unused vendors remain → take all unused first,
 *      then fill from the beginning of the sorted list (wrap-around / cycle).
 *    • Example: 10 vendors sorted 1-10:
 *        Lead 1 → vendors 1-5   (vendors 1-5 become "used")
 *        Lead 2 → vendors 6-10  (vendors 6-10 become "used")
 *        Lead 3 → vendors 1-5   (all were used → restart cycle)
 *    • Example: 5 vendors only:
 *        Lead 1 → vendors 1-5
 *        Lead 2 → vendors 1-5   (only 5 exist → same batch again)
 *
 *  Fallback (no vendor has credits):
 *    Use any active+accepted vendor, skip credit deduction.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const assignVendorsToInquiry = async (inquiry, { limit = 5 } = {}) => {
  const { cityId, cityName } = await getCityInfo(inquiry);

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACK — package_id present
  // ═══════════════════════════════════════════════════════════════════════════
  if (inquiry.package_id) {
    const pkg = await BusinessPackage.findById(inquiry.package_id).lean();
    if (!pkg?.vendor_id) return [];

    // Find the BusinessProfile for this vendor+service (no city filter for callback)
    const profileQuery = { vendor_id: pkg.vendor_id, isActive: true };
    if (pkg.service_id) profileQuery.service_id = pkg.service_id;

    const profile =
      (await BusinessProfile.findOne(profileQuery).lean()) ||
      (await BusinessProfile.findOne({ vendor_id: pkg.vendor_id, isActive: true }).lean());

    if (!profile) return [];

    // Credits & status gate — always from Vendor table
    const vendor =
      (await Vendor.findOne({ _id: profile.vendor_id, isActive: true, profile_status: 'accepted' }).lean()) ||
      (await Vendor.findOne({ _id: profile.vendor_id, isActive: true }).lean());

    if (!vendor) return [];

    const now = new Date();
    const assignment = {
      inquiry_id: inquiry._id,
      vendor_id: vendor._id,
      business_profile_id: profile._id,
      customer_id: inquiry.customer_id,
      service_id: inquiry.service_id || profile.service_id,
      city_name: cityName,
      assigned_at: now,
      last_assigned_at: now,
      status: 'assigned',
      credits_deducted: false,
      isActive: true
    };

    try {
      await LeadAssignment.insertMany([assignment], { ordered: false });
      await deductCreditForAssignment(vendor._id, inquiry._id);
    } catch (_) {
      // Ignore duplicate-key (idempotency)
    }

    return [assignment];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENQUIRY — find matching BusinessProfiles via selectedCities + service_id
  // ═══════════════════════════════════════════════════════════════════════════

  // Step 1: Find all active BusinessProfiles for this service + city
  const profileQuery = { isActive: true };
  if (inquiry.service_id) profileQuery.service_id = inquiry.service_id;
  if (cityId) profileQuery.selectedCities = cityId;  // city_id in the selectedCities array

  let matchingProfiles = await BusinessProfile.find(profileQuery)
    .select('_id vendor_id service_id')
    .lean();

  // Fallback: if city_id not available or no results, try address.city string
  if (!matchingProfiles.length && cityName) {
    const fbQuery = { isActive: true };
    if (inquiry.service_id) fbQuery.service_id = inquiry.service_id;
    fbQuery['address.city'] = new RegExp(`^${escapeRegex(cityName)}$`, 'i');
    matchingProfiles = await BusinessProfile.find(fbQuery)
      .select('_id vendor_id service_id')
      .lean();
  }

  if (!matchingProfiles.length) return [];

  // Step 2: Build vendorId → profileId map (one profile per vendor)
  const vendorProfileMap = new Map();
  matchingProfiles.forEach((p) => {
    if (!vendorProfileMap.has(String(p.vendor_id))) {
      vendorProfileMap.set(String(p.vendor_id), p._id);
    }
  });

  const allVendorIds = [...vendorProfileMap.keys()].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // Step 3: Gate by Vendor table — active + accepted + credits > 0
  let eligibleVendors = await Vendor.find({
    _id: { $in: allVendorIds },
    isActive: true,
    profile_status: 'accepted',
    credits: { $gt: 0 }
  }).lean();

  const hasCreditVendors = eligibleVendors.length > 0;

  // Fallback: no credits → use any active+accepted vendor (no credit deduction later)
  if (!hasCreditVendors) {
    eligibleVendors = await Vendor.find({
      _id: { $in: allVendorIds },
      isActive: true,
      profile_status: 'accepted'
    }).lean();
  }

  if (!eligibleVendors.length) return [];

  // Step 4: Fetch avgRating for each eligible vendor from Review table
  const eligibleIds = eligibleVendors.map((v) => v._id);
  const ratings = await Review.aggregate([
    { $match: { vendor_id: { $in: eligibleIds }, isActive: true, status: 'accepted' } },
    { $group: { _id: '$vendor_id', avgRating: { $avg: '$rating' } } }
  ]);
  const ratingMap = ratings.reduce((acc, e) => {
    acc[String(e._id)] = e.avgRating || 0;
    return acc;
  }, {});

  // Step 5: Sort the FULL eligible pool — avgRating DESC, credits DESC
  //   This produces the STABLE ordered master list from which we slice batches.
  const sortedEligible = eligibleVendors
    .map((v) => ({ ...v, avgRating: ratingMap[String(v._id)] || 0 }))
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.credits - a.credits;
    });

  // Step 6: Global rotation — which vendors have already received a lead
  //   for this service+city combination (across ALL customers)?
  const globalUsedIds = await LeadAssignment.distinct('vendor_id', {
    ...(inquiry.service_id ? { service_id: inquiry.service_id } : {}),
    ...(cityName ? { city_name: new RegExp(`^${escapeRegex(cityName)}$`, 'i') } : {}),
    isActive: true
  });
  const usedSet = new Set(globalUsedIds.map((id) => String(id)));

  // Step 7: Pick the NEXT batch from the sorted list
  //   • Take unused vendors first (in sorted order).
  //   • If fewer than `limit` are unused, wrap around and fill from the
  //     beginning of the sorted list (i.e. cycle restarts).
  const unused = sortedEligible.filter((v) => !usedSet.has(String(v._id)));
  const used   = sortedEligible.filter((v) =>  usedSet.has(String(v._id)));

  let selected;
  if (unused.length >= limit) {
    // Enough fresh vendors — take first `limit` from sorted unused list
    selected = unused.slice(0, limit);
  } else if (unused.length > 0) {
    // Some unused remain — take all of them, fill remainder from used (cycle)
    selected = [...unused, ...used].slice(0, limit);
  } else {
    // All vendors have been cycled — restart from top of sorted list
    selected = sortedEligible.slice(0, limit);
  }

  if (!selected.length) return [];

  const now = new Date();
  const assignments = selected.map((vendor) => ({
    inquiry_id: inquiry._id,
    vendor_id: vendor._id,
    business_profile_id: vendorProfileMap.get(String(vendor._id)) || null,
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
    // Only deduct credits when vendors with credits were selected
    if (hasCreditVendors) {
      for (const vendor of selected) {
        await deductCreditForAssignment(vendor._id, inquiry._id);
      }
    }
  } catch (_) {
    // Ignore duplicate-key errors (idempotency)
  }

  return assignments;
};

module.exports = {
  assignVendorsToInquiry
};
