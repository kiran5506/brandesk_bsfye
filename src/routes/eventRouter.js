const express = require('express');
const eventController = require('../controllers/eventController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/event/list:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events
 *       404:
 *         description: No events found
 */
router.get('/list', eventController.list);

/**
 * @swagger
 * /api/event/findById/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event found
 *       404:
 *         description: Event not found
 */
router.get('/findById/:id', eventController.findById);

/**
 * @swagger
 * /api/event/category/{category}:
 *   get:
 *     summary: Get events by category
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events found for category
 *       404:
 *         description: No events found for this category
 */
router.get('/category/:category', eventController.findByCategory);

/**
 * @swagger
 * /api/event/create:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               eventName:
 *                 type: string
 *               serviceCategory:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), eventController.create);

/**
 * @swagger
 * /api/event/edit/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
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
 *               eventName:
 *                 type: string
 *               serviceCategory:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), eventController.edit);

/**
 * @swagger
 * /api/event/delete/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
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
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, eventController.delete);

module.exports = router;
