const express = require('express');
const inquiryController = require('../controllers/customerInquiryController');
const router = express.Router();

/**
 * @swagger
 * /api/inquiry/create:
 *   post:
 *     summary: Create a new customer inquiry
 *     tags: [Customer Inquiry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - customer_mobile
 *               - city
 *               - event_date
 *             properties:
 *               customer_name:
 *                 type: string
 *                 description: Name of the customer
 *               customer_mobile:
 *                 type: string
 *                 description: 10-digit mobile number
 *               city:
 *                 type: string
 *                 description: City name
 *               event_date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date
 *     responses:
 *       201:
 *         description: Customer inquiry created successfully
 *       400:
 *         description: Validation error or inquiry already exists
 *       500:
 *         description: Server error
 */
router.post('/create', inquiryController.create);

/**
 * @swagger
 * /api/inquiry/list:
 *   get:
 *     summary: Get all customer inquiries with pagination
 *     tags: [Customer Inquiry]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: is_verified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of customer inquiries
 *       404:
 *         description: No inquiries found
 *       500:
 *         description: Server error
 */
router.get('/list', inquiryController.list);

/**
 * @swagger
 * /api/inquiry/findById/{id}:
 *   get:
 *     summary: Get customer inquiry by ID
 *     tags: [Customer Inquiry]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer inquiry found
 *       404:
 *         description: Customer inquiry not found
 *       500:
 *         description: Server error
 */
router.get('/findById/:id', inquiryController.findById);

/**
 * @swagger
 * /api/inquiry/byStatus/{status}:
 *   get:
 *     summary: Get inquiries by status with pagination
 *     tags: [Customer Inquiry]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, verified, contacted, completed, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Inquiries retrieved successfully
 *       404:
 *         description: No inquiries found
 *       500:
 *         description: Server error
 */
//router.get('/byStatus/:status', inquiryController.getByStatus);

/**
 * @swagger
 * /api/inquiry/update/{id}:
 *   put:
 *     summary: Update entire customer inquiry
 *     tags: [Customer Inquiry]
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
 *               customer_name:
 *                 type: string
 *               customer_mobile:
 *                 type: string
 *               city:
 *                 type: string
 *               event_:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, verified, contacted, completed, rejected]
 *               OTP:
 *                 type: string
 *               is_verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer inquiry updated successfully
 *       404:
 *         description: Customer inquiry not found
 *       500:
 *         description: Server error
 */
router.put('/update/:id', inquiryController.update);

/**
 * @swagger
 * /api/inquiry/updateStatus/{id}:
 *   put:
 *     summary: Update customer inquiry OTP and verification
 *     tags: [Customer Inquiry]
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
 *               OTP:
 *                 type: string
 *               is_verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Inquiry updated successfully
 *       404:
 *         description: Customer inquiry not found
 *       500:
 *         description: Server error
 */
router.put('/updateStatus/:id', inquiryController.updateStatus);

/**
 * @swagger
 * /api/inquiry/delete/{id}:
 *   delete:
 *     summary: Delete/Deactivate customer inquiry
 *     tags: [Customer Inquiry]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer inquiry deleted successfully
 *       404:
 *         description: Customer inquiry not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', inquiryController.delete);


router.post('/verifyOtp', inquiryController.verifyOtp);

module.exports = router;
