const express = require('express');
const customerController = require('../controllers/customerController');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/customer/create:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mobile_number
 *               - email
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               mobile_number:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               is_otp_verified:
 *                 type: boolean
 *                 example: false
 *               otp_code:
 *                 type: string
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [direct, enquiry]
 *                 example: direct
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Customer already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
//router.post('/create', authenticateJWT, customerController.create);

/**
 * @swagger
 * /api/customer/list:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all customers
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/list', authenticateJWT, customerController.list);

/**
 * @swagger
 * /api/customer/view/{id}:
 *   get:
 *     summary: Get customer details by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/view/:id', authenticateJWT, customerController.view);

/**
 * @swagger
 * /api/customer/edit/{id}:
 *   put:
 *     summary: Update customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile_number:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               is_otp_verified:
 *                 type: boolean
 *               otp_code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [direct, enquiry]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Email or mobile number already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.put('/edit/:id', authenticateJWT, customerController.edit);

/**
 * @swagger
 * /api/customer/delete/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', authenticateJWT, customerController.delete);

/**
 * @swagger
 * /api/customer/toggle-status/{id}:
 *   patch:
 *     summary: Toggle customer active status
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.patch('/toggle-status/:id', authenticateJWT, customerController.toggleStatus);

/**
 * @swagger
 * /api/customer/list-by-type/{type}:
 *   get:
 *     summary: Get customers by type (direct or enquiry)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [direct, enquiry]
 *         description: Customer type
 *     responses:
 *       200:
 *         description: List of customers by type
 *       400:
 *         description: Invalid type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/list-by-type/:type', authenticateJWT, customerController.listByType);

module.exports = router;
