const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const upload = require('../middlewares/multer');
const authenticateJWT = require('../middlewares/authToken');
const adDashboardController = require('../controllers/adDashboardController');

const router = express.Router();

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Admin registration
 *     tags: [Admin Authentication]
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
 *             required:
 *               - email
 *               - password
 *               - name
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Invalid input or admin already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/register', authenticateJWT, adminAuthController.register);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Authentication]
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
 *         description: Admin login successful, returns JWT token
 *       401:
 *         description: Invalid credentials or unauthorized
 *       500:
 *         description: Server error
 */
router.post('/login', authenticateJWT, adminAuthController.login);

/**
 * @swagger
 * /api/admin/siteSettings/{id}:
 *   put:
 *     summary: Update site settings
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Settings ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               footer_logo:
 *                 type: string
 *                 format: binary
 *               favicon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Site settings updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Server error
 */
router.put('/siteSettings/:id', authenticateJWT, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'footer_logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), adDashboardController.siteSettings);

/**
 * @swagger
 * /api/admin/getSiteSettings/{id}:
 *   get:
 *     summary: Get site settings
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Settings ID
 *     responses:
 *       200:
 *         description: Site settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Server error
 */
router.get('/getSiteSettings/:id', authenticateJWT, adDashboardController.getSiteSettings);

module.exports = router;