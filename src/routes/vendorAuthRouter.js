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

module.exports = router;