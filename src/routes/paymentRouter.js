const express = require('express');
const paymentController = require('../controllers/paymentController');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     summary: Create Razorpay order for lead package
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadPackageId:
 *                 type: string
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Razorpay order created
 */
router.post('/create-order', authenticateJWT, paymentController.createOrder);

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Verify Razorpay payment and add credits
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               vendorId:
 *                 type: string
 *               leadPackageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.post('/verify', authenticateJWT, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payment/transactions/{vendorId}:
 *   get:
 *     summary: Get paid/failed transactions for a vendor
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions/:vendorId', authenticateJWT, paymentController.getTransactions);

module.exports = router;
