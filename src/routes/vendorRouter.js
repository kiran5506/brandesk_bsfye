const express = require('express');
const vendorController = require('../controllers/vendorController');
const authenticateJWT = require('../middlewares/authToken');
const upload = require('../middlewares/multer');

const router = express.Router();

/**
 * @swagger
 * /api/vendor/list:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No vendors found
 *       500:
 *         description: Server error
 */
router.get('/list', authenticateJWT, vendorController.list);

/**
 * @swagger
 * /api/vendor/list-with-status:
 *   get:
 *     summary: Get all vendors with status and business profiles
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: profile_status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Filter vendors by profile status
 *     responses:
 *       200:
 *         description: List of vendors with status and business profiles
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No vendors found
 *       500:
 *         description: Server error
 */
router.get('/list-with-status',  vendorController.listWithStatus);

/**
 * @swagger
 * /api/vendor/approve-reject/{id}:
 *   patch:
 *     summary: Approve or reject a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *             required:
 *               - profile_status
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.patch('/approve-reject/:id', authenticateJWT, vendorController.approveOrReject);

/**
 * @swagger
 * /api/vendor/view/{id}:
 *   get:
 *     summary: Get vendor details by ID
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/view/:id', authenticateJWT, vendorController.view);

/**
 * @swagger
 * /api/vendor/edit/{id}:
 *   put:
 *     summary: Update vendor information
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile_number:
 *                 type: string
 *               address:
 *                 type: string
 *               profile_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.put('/edit/:id', authenticateJWT, upload.fields([{ name: 'profile_image', maxCount: 1 }]), vendorController.edit);

/**
 * @swagger
 * /api/vendor/update-password/{id}:
 *   put:
 *     summary: Update vendor password
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input or password mismatch
 *       401:
 *         description: Old password is incorrect
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.put('/update-password/:id', authenticateJWT, vendorController.updatePassword);

/**
 * @swagger
 * /api/vendor/delete/{id}:
 *   delete:
 *     summary: Delete vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', authenticateJWT, vendorController.delete);

module.exports = router;