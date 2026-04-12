const Wishlist = require('../models/wishlistModel');
const BusinessProfile = require('../models/businessProfileModel');
const BusinessPackage = require('../models/businessPackageModel');
const customers = require('../models/customerModel');
const baseUrl = process.env.BASE_URL;

const ensureCustomer = (req, res) => {
    if (req.user?.role && req.user.role !== 'customer') {
        res.status(403).json({ status: false, message: 'Only customers can access wishlist.' });
        return false;
    }
    return true;
};

exports.toggle = async (req, res) => {
    console.log('request body:--->', req.body);
    const customerId = req.body.customerId;
    const businessProfileId = req.body.businessProfileId;

    try {
        //if (!ensureCustomer(req, res)) return;
        if (!customerId || !businessProfileId) {
            return res.status(400).json({ status: false, message: 'businessProfileId is required.' });
        }

        const isUserExists = await customers.findById(customerId);
        if (!isUserExists) {
            return res.status(404).json({ status: false, message: 'Customer not found.' });
        }
        const isProfileExists = await BusinessProfile.findById(businessProfileId);
        if (!isProfileExists) {
            return res.status(404).json({ status: false, message: 'Business profile not found.' });
        }

        const existing = await Wishlist.findOne({ customer_id: customerId, business_profile_id: businessProfileId });
        if (existing) {
            await Wishlist.findByIdAndDelete(existing._id);
            return res.status(200).json({ status: true, message: 'Removed from wishlist.', data: { added: false } });
        }

        await Wishlist.create({ customer_id: customerId, business_profile_id: businessProfileId });
        return res.status(200).json({ status: true, message: 'Added to wishlist.', data: { added: true } });
    } catch (err) {
        const message = err?.message || err?.response?.data?.message || String(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};

exports.listIds = async (req, res) => {
    const customerId = req.query?.customer_id || req.query?.customerId;
    console.log('customerId from query:--->', customerId);
    try {
        if (!customerId) {
            return res.status(401).json({ status: false, message: 'Unauthorized customer.' });
        }

        const entries = await Wishlist.find({ customer_id: customerId }).select('business_profile_id');
        const ids = entries.map((entry) => entry.business_profile_id.toString());
        res.status(200).json({ status: true, data: ids });
    } catch (err) {
        const message = err?.message || err?.response?.data?.message || String(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};

exports.list = async (req, res) => {
    const customerId = req.query.customer_id;
    try {
        if (!customerId) {
            return res.status(401).json({ status: false, message: 'Unauthorized customer.' });
        }

        const wishlists = await Wishlist.find({ customer_id: customerId }).sort({ createdAt: -1 });
        if (!wishlists.length) {
            return res.status(200).json({ status: true, message: 'Wishlist is empty.', data: [] });
        }

        const profileIds = wishlists.map((item) => item.business_profile_id);
        const profiles = await BusinessProfile.find({ _id: { $in: profileIds } })
            .populate('vendor_id', 'name email mobile_number')
            .populate('service_id', 'serviceName serviceType');

        const vendorIds = profiles.map((profile) => profile.vendor_id?._id || profile.vendor_id).filter(Boolean);
        const serviceIds = profiles.map((profile) => profile.service_id?._id || profile.service_id).filter(Boolean);

        const packages = await BusinessPackage.find({
            vendor_id: { $in: vendorIds },
            service_id: { $in: serviceIds }
        }).select('vendor_id service_id cityPricing');

        const lowestByVendorService = packages.reduce((acc, pkg) => {
            const vendorId = pkg.vendor_id?.toString();
            const serviceId = pkg.service_id?.toString();
            if (!vendorId || !serviceId) return acc;
            const key = `${vendorId}-${serviceId}`;
            const pricingList = Array.isArray(pkg.cityPricing) ? pkg.cityPricing : [];
            pricingList.forEach((pricing) => {
                const offer = Number(pricing?.offerPrice || 0);
                const market = Number(pricing?.marketPrice || 0);
                const discount = Number(pricing?.discount || 0);
                if (!offer) return;
                if (!acc[key] || offer < acc[key].offerPrice) {
                    acc[key] = { offerPrice: offer, marketPrice: market, discount };
                }
            });
            return acc;
        }, {});

        const profilesById = profiles.reduce((acc, profile) => {
            const vendorKey = (profile.vendor_id?._id || profile.vendor_id)?.toString();
            const serviceKey = (profile.service_id?._id || profile.service_id)?.toString();
            const pricingKey = vendorKey && serviceKey ? `${vendorKey}-${serviceKey}` : null;
            const lowestPricing = pricingKey ? lowestByVendorService[pricingKey] : null;

            acc[profile._id.toString()] = {
                _id: profile._id,
                vendor_id: profile.vendor_id,
                service_id: profile.service_id,
                serviceName: profile.service_id?.serviceName || '',
                serviceType: profile.service_id?.serviceType || '',
                businessName: profile.businessName,
                profilePicture: profile.profilePicture ? baseUrl + profile.profilePicture : '',
                address: profile.address,
                skills: profile.skills,
                languages: profile.languages,
                cover_images: profile.cover_images?.map((img) => baseUrl + img) || [],
                isActive: profile.isActive,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
                lowestOfferPrice: lowestPricing?.offerPrice || 0,
                lowestMarketPrice: lowestPricing?.marketPrice || 0,
                lowestDiscount: lowestPricing?.discount || 0,
            };
            return acc;
        }, {});

        const responseList = wishlists
            .map((item) => profilesById[item.business_profile_id.toString()])
            .filter(Boolean);

        res.status(200).json({ status: true, message: 'Wishlist items.', data: responseList });
    } catch (err) {
        const message = err?.message || err?.response?.data?.message || String(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};
