const express = require('express');
const cityController = require('../controllers/cityController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/city/list:
 *   get:
 *     summary: Get all cities
 *     tags: [Cities]
 *     responses:
 *       200:
 *         description: List of all cities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *       404:
 *         description: No cities found
 */
router.get('/list', cityController.list);

/**
 * @swagger
 * /api/city/findById/{id}:
 *   get:
 *     summary: Get city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: City found
 *       404:
 *         description: City not found
 */
router.get('/findById/:id', cityController.findById);

/**
 * @swagger
 * /api/city/create:
 *   post:
 *     summary: Create a new city
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cityName:
 *                 type: string
 *             required:
 *               - cityName
 *     responses:
 *       201:
 *         description: City created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, cityController.create);

/**
 * @swagger
 * /api/city/edit/{id}:
 *   put:
 *     summary: Update a city
 *     tags: [Cities]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cityName:
 *                 type: string
 *     responses:
 *       200:
 *         description: City updated successfully
 *       404:
 *         description: City not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, cityController.edit);

/**
 * @swagger
 * /api/city/delete/{id}:
 *   delete:
 *     summary: Delete a city
 *     tags: [Cities]
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
 *         description: City deleted successfully
 *       404:
 *         description: City not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, cityController.delete);

module.exports = router;
