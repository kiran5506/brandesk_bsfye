const express = require('express');
const testimonialController = require('../controllers/testimonialController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');
const upload = require('../middlewares/multer');

/**
 * @swagger
 * /api/testimonial/list:
 *   get:
 *     summary: Get all testimonials
 *     tags: [Testimonials]
 *     responses:
 *       200:
 *         description: List of all testimonials
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
 *         description: No testimonials found
 */
router.get('/list', testimonialController.list);

/**
 * @swagger
 * /api/testimonial/findById/{id}:
 *   get:
 *     summary: Get testimonial by ID
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonial found
 *       404:
 *         description: Testimonial not found
 */
router.get('/findById/:id', testimonialController.findById);

/**
 * @swagger
 * /api/testimonial/create:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *             required:
 *               - title
 *               - description
 *               - rating
 *               - image
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([{ name: 'image', maxCount: 1 }]), testimonialController.create);

/**
 * @swagger
 * /api/testimonial/edit/{id}:
 *   put:
 *     summary: Update a testimonial
 *     tags: [Testimonials]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 *       404:
 *         description: Testimonial not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([{ name: 'image', maxCount: 1 }]), testimonialController.edit);

/**
 * @swagger
 * /api/testimonial/delete/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     tags: [Testimonials]
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
 *         description: Testimonial deleted successfully
 *       404:
 *         description: Testimonial not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, testimonialController.delete);

module.exports = router;
