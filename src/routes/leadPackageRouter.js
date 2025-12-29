const express = require('express');
const leadPackageController = require('../controllers/leadPackageController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/leadpackage/list:
 *   get:
 *     summary: Get all lead packages
 *     tags: [Lead Packages]
 *     responses:
 *       200:
 *         description: List of all lead packages
 *       404:
 *         description: No lead packages found
 */
router.get('/list', leadPackageController.list);

/**
 * @swagger
 * /api/leadpackage/findById/{id}:
 *   get:
 *     summary: Get lead package by ID
 *     tags: [Lead Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead package found
 *       404:
 *         description: Lead package not found
 */
router.get('/findById/:id', leadPackageController.findById);

/**
 * @swagger
 * /api/leadpackage/create:
 *   post:
 *     summary: Create a new lead package
 *     tags: [Lead Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *               totalLeads:
 *                 type: number
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Lead package created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), leadPackageController.create);

/**
 * @swagger
 * /api/leadpackage/edit/{id}:
 *   put:
 *     summary: Update a lead package
 *     tags: [Lead Packages]
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
 *               packageName:
 *                 type: string
 *               totalLeads:
 *                 type: number
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Lead package updated successfully
 *       404:
 *         description: Lead package not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), leadPackageController.edit);

/**
 * @swagger
 * /api/leadpackage/delete/{id}:
 *   delete:
 *     summary: Delete a lead package
 *     tags: [Lead Packages]
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
 *         description: Lead package deleted successfully
 *       404:
 *         description: Lead package not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, leadPackageController.delete);

module.exports = router;
