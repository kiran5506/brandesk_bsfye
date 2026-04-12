const express = require('express');
const businessPackageController = require('../controllers/businessPackageController');
const upload = require('../middlewares/multer');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/business-packages/list:
 *   get:
 *     summary: Get all business packages
 *     tags: [Business Packages]
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: string
 *         description: Filter by vendor id
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: string
 *         description: Filter by event id
 *     responses:
 *       200:
 *         description: List of business packages
 *       404:
 *         description: No business packages found
 */
router.get('/list', businessPackageController.list);

/**
 * @swagger
 * /api/business-packages/vendor/{vendor_id}:
 *   get:
 *     summary: Get business packages by vendor
 *     tags: [Business Packages]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business packages list
 *       404:
 *         description: No business packages found
 */
router.get('/vendor/:vendor_id', businessPackageController.listByVendor);

/**
 * @swagger
 * /api/business-packages/findById/{id}:
 *   get:
 *     summary: Get business package by ID
 *     tags: [Business Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business package found
 *       404:
 *         description: Business package not found
 */
router.get('/findById/:id', businessPackageController.findById);

/**
 * @swagger
 * /api/business-packages/create:
 *   post:
 *     summary: Create a new business package
 *     tags: [Business Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               event_id:
 *                 type: string
 *               packageName:
 *                 type: string
 *               description:
 *                 type: string
 *               cityPricing:
 *                 type: string
 *                 description: JSON string of pricing entries
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Business package created successfully
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'coverImage', maxCount: 1 }
]), businessPackageController.create);

/**
 * @swagger
 * /api/business-packages/edit/{id}:
 *   put:
 *     summary: Update a business package
 *     tags: [Business Packages]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendor_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               event_id:
 *                 type: string
 *               packageName:
 *                 type: string
 *               description:
 *                 type: string
 *               cityPricing:
 *                 type: string
 *                 description: JSON string of pricing entries
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Business package updated successfully
 *       404:
 *         description: Business package not found
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'coverImage', maxCount: 1 }
]), businessPackageController.edit);

/**
 * @swagger
 * /api/business-packages/delete/{id}:
 *   delete:
 *     summary: Delete a business package
 *     tags: [Business Packages]
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
 *         description: Business package deleted successfully
 *       404:
 *         description: Business package not found
 */
router.delete('/delete/:id', authenticateJWT, businessPackageController.delete);

module.exports = router;
