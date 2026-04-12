const express = require('express');
const videoController = require('../controllers/videoController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/video/list:
 *   get:
 *     summary: Get all videos
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: List of all videos
 *       404:
 *         description: No videos found
 */
router.get('/list', videoController.list);

/**
 * @swagger
 * /api/video/findById/{id}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video found
 *       404:
 *         description: Video not found
 */
router.get('/findById/:id', videoController.findById);

/**
 * @swagger
 * /api/video/create:
 *   post:
 *     summary: Create a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoUrl:
 *                 type: string
 *             required:
 *               - videoUrl
 *     responses:
 *       201:
 *         description: Video created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, videoController.create);

/**
 * @swagger
 * /api/video/edit/{id}:
 *   put:
 *     summary: Update a video
 *     tags: [Videos]
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
 *               videoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       404:
 *         description: Video not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, videoController.edit);

/**
 * @swagger
 * /api/video/delete/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
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
 *         description: Video deleted successfully
 *       404:
 *         description: Video not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, videoController.delete);

module.exports = router;
