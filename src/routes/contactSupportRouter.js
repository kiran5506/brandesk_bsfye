const express = require('express');
const router = express.Router();
const contactSupportController = require('../controllers/contactSupportController');

/**
 * @swagger
 * /api/contact-support/create:
 *   post:
 *     summary: Create a new contact support request
 *     tags: [Contact Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - issue
 *               - type
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 description: 10-digit mobile number
 *               issue:
 *                 type: string
 *                 description: Description of the issue
 *               type:
 *                 type: string
 *                 enum: [customer, vendor]
 *                 description: Type of user
 *     responses:
 *       201:
 *         description: Contact support request created successfully
 *       400:
 *         description: Validation error
 */
router.post('/create', contactSupportController.create);

/**
 * @swagger
 * /api/contact-support/list:
 *   get:
 *     summary: Get all contact support requests
 *     tags: [Contact Support]
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
 *           enum: [customer, vendor]
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: List of contact support requests
 *       404:
 *         description: No requests found
 */
router.get('/list', contactSupportController.list);

/**
 * @swagger
 * /api/contact-support/findById/{id}:
 *   get:
 *     summary: Get contact support request by ID
 *     tags: [Contact Support]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact support request ID
 *     responses:
 *       200:
 *         description: Contact support request details
 *       404:
 *         description: Request not found
 */
router.get('/findById/:id', contactSupportController.findById);

/**
 * @swagger
 * /api/contact-support/update-status/{id}:
 *   put:
 *     summary: Update status of a contact support request
 *     tags: [Contact Support]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact support request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: Status (0=pending, 1=resolved)
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Request not found
 */
router.put('/update-status/:id', contactSupportController.updateStatus);

/**
 * @swagger
 * /api/contact-support/delete/{id}:
 *   delete:
 *     summary: Delete a contact support request (soft delete)
 *     tags: [Contact Support]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact support request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       404:
 *         description: Request not found
 */
router.delete('/delete/:id', contactSupportController.delete);

module.exports = router;
