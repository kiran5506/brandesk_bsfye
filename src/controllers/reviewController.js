const Review = require('../models/reviewModel');
const baseUrl = process.env.BASE_URL;

/**
 * Create a new review
 */
exports.create = async (req, res) => {
    console.log(req.body);
    
    const { vendor_id, customer_id, business_profile_id, service_id, review, rating } = req.body;
    const resolvedBusinessProfileId = business_profile_id || service_id || null;
    
    try {
        // Validation
        if (!customer_id) {
            return res.status(401).json({
                status: false,
                message: 'Please login to submit a review.'
            });
        }

        if (!vendor_id || !review || !rating) {
            return res.status(400).json({
                status: false,
                message: 'vendor_id, review, and rating are required'
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                status: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const newReview = new Review({
            vendor_id,
            customer_id,
            business_profile_id: resolvedBusinessProfileId,
            review,
            rating,
            status: 'pending',
            review_type: 'pending'
        });

        const result = await newReview.save();
        await result.populate([
            'vendor_id',
            'customer_id',
            {
                path: 'business_profile_id',
                select: 'businessName service_id vendor_id address'
            }
        ]);

        res.status(201).json({
            status: true,
            message: 'Thank you for your review. It will be visible once approved by the admin.',
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
 * Get all reviews
 */
exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, vendor_id, customer_id } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = { isActive: true };
        if (status) filter.status = status;
        if (vendor_id) filter.vendor_id = vendor_id;
        if (customer_id) filter.customer_id = customer_id;

        const reviews = await Review.find(filter)
            .populate('vendor_id', 'name email mobile_number profile_image')
            .populate('customer_id', 'name email mobile_number')
            .populate('business_profile_id', 'businessName service_id vendor_id address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(filter);

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'No reviews found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Reviews list',
            data: reviews,
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
 * Get review by ID
 */
exports.findById = async (req, res) => {
    const { id } = req.params;

    try {
        const review = await Review.findById(id)
            .populate('vendor_id', 'name email mobile_number profile_image')
            .populate('customer_id', 'name email mobile_number')
            .populate('business_profile_id', 'businessName service_id vendor_id address');

        if (!review) {
            return res.status(404).json({
                status: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Review data',
            data: review
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};

/**
 * Get reviews by vendor ID
 */
exports.findByVendorId = async (req, res) => {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const filter = { vendor_id, isActive: true };
        if (status) filter.status = status;

        const reviews = await Review.find(filter)
            .populate('customer_id', 'name email mobile_number')
            .populate('business_profile_id', 'businessName service_id vendor_id address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(filter);

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'No reviews found for this vendor'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Vendor reviews list',
            data: reviews,
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
 * Get reviews by customer ID
 */
exports.findByCustomerId = async (req, res) => {
    const { customer_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const filter = { customer_id, isActive: true };

        const reviews = await Review.find(filter)
            .populate('vendor_id', 'name email mobile_number profile_image')
            .populate('business_profile_id', 'businessName service_id vendor_id address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(filter);

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'No reviews found for this customer'
            });
        }

        res.status(200).json({
            status: true,
            message: 'Customer reviews list',
            data: reviews,
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
 * Edit review (update status and replay)
 */
exports.edit = async (req, res) => {
    const { id } = req.params;
    const { status, replay_review } = req.body;

    try {
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                status: false,
                message: 'Review not found'
            });
        }

        // Validate status
        if (status && !['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid status. Must be pending, accepted, or rejected'
            });
        }

        const updatedData = {};
        if (status) {
            updatedData.status = status;
            updatedData.review_type = status;
        }
        if (replay_review !== undefined) {
            updatedData.replay_review = replay_review;
        }
        updatedData.updatedAt = new Date();

        const result = await Review.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        ).populate([
            'vendor_id',
            'customer_id',
            {
                path: 'business_profile_id',
                select: 'businessName service_id vendor_id address'
            }
        ]);

        res.status(200).json({
            status: true,
            message: 'Review updated successfully',
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
 * Delete review
 */
exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                status: false,
                message: 'Review not found'
            });
        }

        await Review.findByIdAndDelete(id);

        res.status(200).json({
            status: true,
            message: 'Review deleted successfully',
            id: id
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: `An error occurred: ${err.message}`
        });
    }
};
