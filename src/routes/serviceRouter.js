const express = require('express');
const serviceController = require('../controllers/serviceController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/service/list:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of all services
 *       404:
 *         description: No services found
 */
router.get('/list', serviceController.list);

/**
 * @swagger
 * /api/service/findById/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service found
 *       404:
 *         description: Service not found
 */
router.get('/findById/:id', serviceController.findById);

/**
 * @swagger
 * /api/service/category/{category}:
 *   get:
 *     summary: Get services by category
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services found for category
 *       404:
 *         description: No services found for this category
 */
router.get('/category/:category', serviceController.findByCategory);

/**
 * @swagger
 * /api/service/create:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               serviceName:
 *                 type: string
 *               serviceCategory:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               portfolioType:
 *                 type: string
 *               skills:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Service created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), serviceController.create);

/**
 * @swagger
 * /api/service/edit/{id}:
 *   put:
 *     summary: Update a service
 *     tags: [Services]
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
 *               serviceName:
 *                 type: string
 *               serviceCategory:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               portfolioType:
 *                 type: string
 *               skills:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), serviceController.edit);

/**
 * @swagger
 * /api/service/delete/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Services]
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
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, serviceController.delete);

module.exports = router;
