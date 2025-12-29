const express = require('express');
const packageController = require('../controllers/packageController');

const router = express.Router();

/**
 * @swagger
 * /api/package/list:
 *   get:
 *     summary: Get all packages
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: List of all packages
 *       404:
 *         description: No packages found
 *       500:
 *         description: Server error
 */
router.get('/list', packageController.list);

/**
 * @swagger
 * /api/package/findById/{id}:
 *   get:
 *     summary: Get package by ID
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package found
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.get('/findById/:id', packageController.findById);

/**
 * @swagger
 * /api/package/fetchCourses:
 *   post:
 *     summary: Fetch courses for a package
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageId:
 *                 type: string
 *             required:
 *               - packageId
 *     responses:
 *       200:
 *         description: Courses fetched successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.post('/fetchCourses', packageController.fetchCourses);

/**
 * @swagger
 * /api/package/create:
 *   post:
 *     summary: Create a new package
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *             required:
 *               - packageName
 *               - price
 *     responses:
 *       201:
 *         description: Package created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/create', packageController.create);

/**
 * @swagger
 * /api/package/edit/{id}:
 *   put:
 *     summary: Update a package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Package updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.put('/edit/:id', packageController.edit);

/**
 * @swagger
 * /api/package/delete/{id}:
 *   delete:
 *     summary: Delete a package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', packageController.delete);

module.exports = router;
