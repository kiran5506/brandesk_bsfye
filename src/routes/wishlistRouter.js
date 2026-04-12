const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

/**
 * @swagger
 * /api/wishlist/toggle:
 *   post:
 *     summary: Toggle wishlist item
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessProfileId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wishlist toggled
 */
router.post('/toggle', authenticateJWT, wishlistController.toggle);

/**
 * @swagger
 * /api/wishlist/ids:
 *   get:
 *     summary: Get wishlist business profile IDs
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist ids
 */
router.get('/ids', authenticateJWT, wishlistController.listIds);

/**
 * @swagger
 * /api/wishlist/list:
 *   get:
 *     summary: Get wishlist items
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist list
 */
router.get('/list', authenticateJWT, wishlistController.list);

module.exports = router;
