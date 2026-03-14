const express = require('express');
const reviewController = require('../controllers/reviewController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/review/list:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all reviews
 *       404:
 *         description: No reviews found
 */
router.get('/list', reviewController.list);

/**
 * @swagger
 * /api/review/findById/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review found
 *       404:
 *         description: Review not found
 */
router.get('/findById/:id', reviewController.findById);

/**
 * @swagger
 * /api/review/vendor/{vendor_id}:
 *   get:
 *     summary: Get reviews by vendor ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *     responses:
 *       200:
 *         description: Vendor reviews found
 *       404:
 *         description: No reviews found
 */
router.get('/vendor/:vendor_id', reviewController.findByVendorId);

/**
 * @swagger
 * /api/review/customer/{customer_id}:
 *   get:
 *     summary: Get reviews by customer ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Customer reviews found
 *       404:
 *         description: No reviews found
 */
router.get('/customer/:customer_id', reviewController.findByCustomerId);

/**
 * @swagger
 * /api/review/create:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               review:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *             required:
 *               - vendor_id
 *               - customer_id
 *               - review
 *               - rating
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, reviewController.create);

/**
 * @swagger
 * /api/review/edit/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *               replay_review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.put('/edit/:id', authenticateJWT, reviewController.edit);

/**
 * @swagger
 * /api/review/delete/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.delete('/delete/:id', authenticateJWT, reviewController.delete);

module.exports = router;
