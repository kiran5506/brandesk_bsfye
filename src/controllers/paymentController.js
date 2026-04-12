const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const LeadPackage = require('../models/leadPackageModel');
const Vendor = require('../models/vendorModule');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getErrorMessage = (err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    return (
        err?.error?.description ||
        err?.error?.reason ||
        err?.message ||
        err?.response?.data?.message ||
        err?.toString?.() ||
        JSON.stringify(err)
    );
};

exports.createOrder = async (req, res) => {
    const { leadPackageId, vendorId } = req.body;
    const tokenVendorId = req.user?.id;

    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ status: false, message: 'Razorpay keys are not configured.' });
        }

        if (!leadPackageId || !(vendorId || tokenVendorId)) {
            return res.status(400).json({ status: false, message: 'leadPackageId and vendorId are required.' });
        }

        if (vendorId && tokenVendorId && vendorId.toString() !== tokenVendorId.toString()) {
            return res.status(403).json({ status: false, message: 'Vendor ID does not match the authenticated user.' });
        }

        const resolvedVendorId = vendorId || tokenVendorId;

        const leadPackage = await LeadPackage.findById(leadPackageId);
        if (!leadPackage) {
            return res.status(404).json({ status: false, message: 'Lead package not found.' });
        }

        const vendor = await Vendor.findById(resolvedVendorId);
        if (!vendor) {
            return res.status(404).json({ status: false, message: 'Vendor not found.' });
        }

        const amount = Math.round(Number(leadPackage.amount) * 100);
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `leadpkg_${leadPackageId}_${Date.now()}`,
            notes: {
                vendorId: resolvedVendorId.toString(),
                leadPackageId: leadPackageId.toString(),
            },
        });

        await Payment.create({
            vendor_id: resolvedVendorId,
            leadPackageId,
            razorpayOrderId: order.id,
            amount: leadPackage.amount,
            currency: order.currency,
            status: 'created',
        });

        res.status(200).json({
            status: true,
            message: 'Order created successfully.',
            data: {
                order,
                amount,
                currency: order.currency,
                packageName: leadPackage.packageName,
                totalLeads: leadPackage.totalLeads,
            },
        });
    } catch (err) {
        const message = getErrorMessage(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};

exports.verifyPayment = async (req, res) => {
    const {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        vendorId,
        leadPackageId,
    } = req.body;
    const tokenVendorId = req.user?.id;

    try {
        const orderReference = razorpayOrderId || orderId;
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ status: false, message: 'Razorpay keys are not configured.' });
        }

        if (!orderReference || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ status: false, message: 'Payment verification data is required.' });
        }

        const paymentRecord = await Payment.findOne({ razorpayOrderId: orderReference });
        if (!paymentRecord) {
            return res.status(404).json({ status: false, message: 'Payment record not found.' });
        }

        if (vendorId && tokenVendorId && vendorId.toString() !== tokenVendorId.toString()) {
            return res.status(403).json({ status: false, message: 'Vendor ID does not match the authenticated user.' });
        }

        const signPayload = `${orderReference}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(signPayload)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            paymentRecord.status = 'failed';
            paymentRecord.razorpayPaymentId = razorpayPaymentId;
            paymentRecord.razorpaySignature = razorpaySignature;
            await paymentRecord.save();

            return res.status(400).json({ status: false, message: 'Payment signature mismatch.' });
        }

        const leadPackage = await LeadPackage.findById(leadPackageId || paymentRecord.leadPackageId);
        if (!leadPackage) {
            return res.status(404).json({ status: false, message: 'Lead package not found.' });
        }

        if (paymentRecord.status === 'paid') {
            return res.status(200).json({
                status: true,
                message: 'Payment already verified.',
                data: {
                    vendorId: paymentRecord.vendor_id,
                    leadPackageId: paymentRecord.leadPackageId,
                },
            });
        }

        paymentRecord.status = 'paid';
        paymentRecord.razorpayPaymentId = razorpayPaymentId;
        paymentRecord.razorpaySignature = razorpaySignature;
        await paymentRecord.save();

        const vendor = await Vendor.findById(vendorId || tokenVendorId || paymentRecord.vendor_id);
        if (!vendor) {
            return res.status(404).json({ status: false, message: 'Vendor not found.' });
        }

        vendor.credits = (vendor.credits || 0) + (leadPackage.totalLeads || 0);
        await vendor.save();

        res.status(200).json({
            status: true,
            message: 'Payment verified and credits added successfully.',
            data: {
                vendorId: vendor._id,
                credits: vendor.credits,
                leadPackageId: leadPackage._id,
            },
        });
    } catch (err) {
        const message = getErrorMessage(err);
        res.status(500).json({ status: false, message: `An error occurred: ${message}` });
    }
};
