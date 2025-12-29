const express = require('express');
const tutorialController = require('../controllers/tutorialController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/tutorial/list:
 *   get:
 *     summary: Get all tutorials
 *     tags: [Tutorials]
 *     responses:
 *       200:
 *         description: List of all tutorials
 *       404:
 *         description: No tutorials found
 */
router.get('/list', tutorialController.list);

/**
 * @swagger
 * /api/tutorial/findById/{id}:
 *   get:
 *     summary: Get tutorial by ID
 *     tags: [Tutorials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutorial found
 *       404:
 *         description: Tutorial not found
 */
router.get('/findById/:id', tutorialController.findById);

/**
 * @swagger
 * /api/tutorial/language/{language}:
 *   get:
 *     summary: Get tutorials by language
 *     tags: [Tutorials]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutorials found for language
 *       404:
 *         description: No tutorials found for this language
 */
router.get('/language/:language', tutorialController.findByLanguage);

/**
 * @swagger
 * /api/tutorial/create:
 *   post:
 *     summary: Create a new tutorial
 *     tags: [Tutorials]
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
 *               language:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tutorial created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), tutorialController.create);

/**
 * @swagger
 * /api/tutorial/edit/{id}:
 *   put:
 *     summary: Update a tutorial
 *     tags: [Tutorials]
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
 *               language:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Tutorial updated successfully
 *       404:
 *         description: Tutorial not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'image', maxCount: 1 }
]), tutorialController.edit);

/**
 * @swagger
 * /api/tutorial/delete/{id}:
 *   delete:
 *     summary: Delete a tutorial
 *     tags: [Tutorials]
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
 *         description: Tutorial deleted successfully
 *       404:
 *         description: Tutorial not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, tutorialController.delete);

module.exports = router;
