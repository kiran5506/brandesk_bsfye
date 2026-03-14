const express = require('express');
const customerAuthController = require('../controllers/customerAuthController');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/customerauth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mobile_number
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               mobile_number:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 example: password123
 *               type:
 *                 type: string
 *                 enum: [direct, enquiry]
 *                 example: direct
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Validation error or customer already exists
 *       500:
 *         description: Server error
 */
router.post('/register', customerAuthController.register);

/**
 * @swagger
 * /api/customerauth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/login', customerAuthController.login);

/**
 * @swagger
 * /api/customerauth/verify-otp:
 *   post:
 *     summary: Verify customer OTP
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - otp_code
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: 60d5ec49f1b2c72b8c8e4f1a
 *               otp_code:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', customerAuthController.verifyOtp);

/**
 * @swagger
 * /api/customerauth/resend-otp:
 *   post:
 *     summary: Resend OTP to customer
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: 60d5ec49f1b2c72b8c8e4f1a
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Customer already verified
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/resend-otp', customerAuthController.resendOtp);

/**
 * @swagger
 * /api/customerauth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', customerAuthController.forgotPassword);

/**
 * @swagger
 * /api/customerauth/reset-password:
 *   post:
 *     summary: Reset customer password with OTP
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - otp_code
 *               - new_password
 *               - confirm_password
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: 60d5ec49f1b2c72b8c8e4f1a
 *               otp_code:
 *                 type: string
 *                 example: "1234"
 *               new_password:
 *                 type: string
 *                 example: newpassword123
 *               confirm_password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP or passwords don't match
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', customerAuthController.resetPassword);

/**
 * @swagger
 * /api/customerauth/change-password:
 *   post:
 *     summary: Change customer password (for authenticated users)
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - old_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: 60d5ec49f1b2c72b8c8e4f1a
 *               old_password:
 *                 type: string
 *                 example: oldpassword123
 *               new_password:
 *                 type: string
 *                 example: newpassword123
 *               confirm_password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or old password incorrect
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/change-password', authenticateJWT, customerAuthController.changePassword);

module.exports = router;
