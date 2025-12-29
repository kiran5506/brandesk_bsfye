const express = require('express');
const sliderController = require('../controllers/sliderController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT =  require('../middlewares/authToken');

/**
 * @swagger
 * /api/slider/list:
 *   get:
 *     summary: Get all sliders
 *     tags: [Sliders]
 *     responses:
 *       200:
 *         description: List of all sliders
 *       404:
 *         description: No sliders found
 */
router.get('/list', sliderController.list);

/**
 * @swagger
 * /api/slider/findById/{id}:
 *   get:
 *     summary: Get slider by ID
 *     tags: [Sliders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slider found
 *       404:
 *         description: Slider not found
 */
router.get('/findById/:id', sliderController.findById);

/**
 * @swagger
 * /api/slider/create:
 *   post:
 *     summary: Create a new slider
 *     tags: [Sliders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               linkTitle:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               bannerDesktop:
 *                 type: string
 *                 format: binary
 *               bannerMobile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Slider created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'bannerDesktop', maxCount: 1 },
    { name: 'bannerMobile', maxCount: 1 }
]), sliderController.create);

/**
 * @swagger
 * /api/slider/edit/{id}:
 *   put:
 *     summary: Update a slider
 *     tags: [Sliders]
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
 *               linkTitle:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               bannerDesktop:
 *                 type: string
 *                 format: binary
 *               bannerMobile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Slider updated successfully
 *       404:
 *         description: Slider not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'bannerDesktop', maxCount: 1 },
    { name: 'bannerMobile', maxCount: 1 }
]), sliderController.edit);

/**
 * @swagger
 * /api/slider/delete/{id}:
 *   delete:
 *     summary: Delete a slider
 *     tags: [Sliders]
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
 *         description: Slider deleted successfully
 *       404:
 *         description: Slider not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, sliderController.delete);

module.exports = router;