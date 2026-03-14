const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

/**
 * @swagger
 * /api/feedback/create:
 *   post:
 *     summary: Create a new feedback request
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - feedback
 *               - type
 *             properties:
 *               vendor_id:
 *                 type: string
 *                 description: Vendor ID (required if type is vendor)
 *               user_id:
 *                 type: string
 *                 description: User/Customer ID (required if type is user)
 *               type:
 *                 type: string
 *                 enum: [vendor, user]
 *                 description: Type of feedback provider
 *               mobile_number:
 *                 type: string
 *                 description: 10-digit mobile number
 *               feedback:
 *                 type: string
 *                 description: Feedback text
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *       400:
 *         description: Validation error
 */
router.post('/create', feedbackController.create);

/**
 * @swagger
 * /api/feedback/list:
 *   get:
 *     summary: Get all feedback requests
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by status (0=pending, 1=resolved)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vendor, user]
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: List of feedback requests
 *       404:
 *         description: No feedback found
 */
router.get('/list', feedbackController.list);

/**
 * @swagger
 * /api/feedback/findById/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *       404:
 *         description: Feedback not found
 */
router.get('/findById/:id', feedbackController.findById);

/**
 * @swagger
 * /api/feedback/edit/{id}:
 *   put:
 *     summary: Update feedback by ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Feedback status
 *               feedback:
 *                 type: string
 *                 description: Updated feedback text
 *               mobile_number:
 *                 type: string
 *                 description: Updated mobile number
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *       404:
 *         description: Feedback not found
 */
router.put('/edit/:id', feedbackController.edit);

/**
 * @swagger
 * /api/feedback/delete/{id}:
 *   delete:
 *     summary: Delete feedback by ID (soft delete)
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 */
router.delete('/delete/:id', feedbackController.delete);

/**
 * @swagger
 * /api/feedback/vendor/{vendor_id}:
 *   get:
 *     summary: Get feedback by vendor ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Vendor feedback retrieved successfully
 *       404:
 *         description: No feedback found
 */
router.get('/vendor/:vendor_id', feedbackController.findByVendorId);

/**
 * @swagger
 * /api/feedback/user/{user_id}:
 *   get:
 *     summary: Get feedback by user ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User feedback retrieved successfully
 *       404:
 *         description: No feedback found
 */
router.get('/user/:user_id', feedbackController.findByUserId);

module.exports = router;
