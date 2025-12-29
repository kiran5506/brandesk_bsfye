const express = require('express');
const authController = require('../controllers/authController');
const mailController = require('../controllers/mailController');
const upload = require('../middlewares/multer');

const router = express.Router();

/**
 * @swagger
 * /api/singup:
 *   post:
 *     summary: User sign up
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *               - name
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post('/singup', authController.singUp);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', authController.logIn);

/**
 * @swagger
 * /api/signout:
 *   post:
 *     summary: User sign out
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User signed out successfully
 *       500:
 *         description: Server error
 */
router.post('/signout', authController.signOut);

/**
 * @swagger
 * /api/generate-token:
 *   post:
 *     summary: Generate new JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Token generated successfully
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.post('/generate-token', authController.generateToken);

/**
 * @swagger
 * /api/sendmail:
 *   post:
 *     summary: Send email
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - to
 *               - subject
 *               - message
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid email data
 *       500:
 *         description: Server error
 */
router.post('/sendmail', mailController.sendMail);

module.exports = router;