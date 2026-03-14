const express = require('express');
const vendorAuthController = require('../controllers/vendorAuthController');
const upload = require('../middlewares/multer');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/vendorauth/register:
 *   post:
 *     summary: Vendor registration
 *     tags: [Vendor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               businessName:
 *                 type: string
 *               phone:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *               - name
 *               - businessName
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *       400:
 *         description: Invalid input or vendor already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/register', authenticateJWT, vendorAuthController.register);

/**
 * @swagger
 * /api/vendorauth/login:
 *   post:
 *     summary: Vendor login
 *     tags: [Vendor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Vendor login successful, returns JWT token
 *       401:
 *         description: Invalid credentials or unauthorized
 *       500:
 *         description: Server error
 */
router.post('/login', authenticateJWT, vendorAuthController.login);

/**
 * @swagger
 * /api/vendorauth/verify-otp:
 *   post:
 *     summary: Verify OTP for vendor registration
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *               otp_code:
 *                 type: string
 *             required:
 *               - vendor_id
 *               - otp_code
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', vendorAuthController.verifyOtp);

/**
 * @swagger
 * /api/vendorauth/update-profile-completion:
 *   post:
 *     summary: Update vendor profile completion status
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 description: Vendor ID
 *     responses:
 *       200:
 *         description: Profile completion status updated successfully
 *       400:
 *         description: Vendor ID is required
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.post('/update-profile-completion', vendorAuthController.updateProfileCompletionStatus);

/**
 * @swagger
 * /api/vendorauth/generate-otp:
 *   post:
 *     summary: Generate new OTP for vendor
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 description: Vendor ID
 *     responses:
 *       200:
 *         description: OTP generated successfully
 *       400:
 *         description: Vendor ID is required
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.post('/generate-otp', vendorAuthController.generateOTP);

module.exports = router;