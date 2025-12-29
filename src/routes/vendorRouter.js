const express = require('express');
const vendorController = require('../controllers/vendorController');
const authenticateJWT = require('../middlewares/authToken');

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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *               address:
 *                 type: string
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
router.put('/edit/:id', authenticateJWT, vendorController.edit);

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