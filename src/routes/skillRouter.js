const express = require('express');
const skillController = require('../controllers/skillController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');

/**
 * @swagger
 * /api/skill/list:
 *   get:
 *     summary: Get all skills
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: List of all skills
 *       404:
 *         description: No skills found
 */
router.get('/list', skillController.list);

/**
 * @swagger
 * /api/skill/findById/{id}:
 *   get:
 *     summary: Get skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill found
 *       404:
 *         description: Skill not found
 */
router.get('/findById/:id', skillController.findById);

/**
 * @swagger
 * /api/skill/create:
 *   post:
 *     summary: Create a new skill
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skillName:
 *                 type: string
 *             required:
 *               - skillName
 *     responses:
 *       201:
 *         description: Skill created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, skillController.create);

/**
 * @swagger
 * /api/skill/edit/{id}:
 *   put:
 *     summary: Update a skill
 *     tags: [Skills]
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
 *               skillName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *       404:
 *         description: Skill not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, skillController.edit);

/**
 * @swagger
 * /api/skill/delete/{id}:
 *   delete:
 *     summary: Delete a skill
 *     tags: [Skills]
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
 *         description: Skill deleted successfully
 *       404:
 *         description: Skill not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, skillController.delete);

module.exports = router;
