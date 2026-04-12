const express = require('express');
const statsController = require('../controllers/statsController');

const router = express.Router();

/**
 * @swagger
 * /api/stats/counts:
 *   get:
 *     summary: Get counts for cities, vendors, and customers
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Counts fetched
 */
router.get('/counts', statsController.counts);

module.exports = router;
