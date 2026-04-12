const City = require('../models/cityModel');
const Vendor = require('../models/vendorModule');
const Customer = require('../models/customerModel');

exports.counts = async (req, res) => {
    try {
        const [cityCount, vendorCount, customerCount] = await Promise.all([
            City.countDocuments(),
            Vendor.countDocuments(),
            Customer.countDocuments(),
        ]);

        res.status(200).json({
            status: true,
            message: 'Counts fetched successfully.',
            data: {
                cities: cityCount,
                vendors: vendorCount,
                customers: customerCount,
            },
        });
    } catch (err) {
        const message = err?.message || err?.response?.data?.message || String(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};
