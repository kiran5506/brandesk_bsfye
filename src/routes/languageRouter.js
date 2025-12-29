const express = require('express');
const languageController = require('../controllers/languageController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/language/list:
 *   get:
 *     summary: Get all languages
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: List of all languages
 *       404:
 *         description: No languages found
 */
router.get('/list', languageController.list);

/**
 * @swagger
 * /api/language/findById/{id}:
 *   get:
 *     summary: Get language by ID
 *     tags: [Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language found
 *       404:
 *         description: Language not found
 */
router.get('/findById/:id', languageController.findById);

/**
 * @swagger
 * /api/language/create:
 *   post:
 *     summary: Create a new language
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               languageName:
 *                 type: string
 *             required:
 *               - languageName
 *     responses:
 *       201:
 *         description: Language created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, languageController.create);

/**
 * @swagger
 * /api/language/edit/{id}:
 *   put:
 *     summary: Update a language
 *     tags: [Languages]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               languageName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Language updated successfully
 *       404:
 *         description: Language not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, languageController.edit);

/**
 * @swagger
 * /api/language/delete/{id}:
 *   delete:
 *     summary: Delete a language
 *     tags: [Languages]
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
 *         description: Language deleted successfully
 *       404:
 *         description: Language not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, languageController.delete);

module.exports = router;
