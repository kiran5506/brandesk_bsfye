const express = require('express');
const blogController = require('../controllers/blogController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authToken');
const upload = require('../middlewares/multer');

/**
 * @swagger
 * /api/blog/list:
 *   get:
 *     summary: Get all active blogs (public)
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: List of all active blogs
 *       404:
 *         description: No blogs found
 */
router.get('/list', blogController.list);

/**
 * @swagger
 * /api/blog/admin/list:
 *   get:
 *     summary: Get all blogs including inactive (admin only)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all blogs
 *       404:
 *         description: No blogs found
 */
router.get('/admin/list', authenticateJWT, blogController.adminList);

/**
 * @swagger
 * /api/blog/findById/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog found
 *       404:
 *         description: Blog not found
 */
router.get('/findById/:id', blogController.findById);

/**
 * @swagger
 * /api/blog/create:
 *   post:
 *     summary: Create a new blog (admin only)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - shortDescription
 *               - content
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authenticateJWT, upload.fields([{ name: 'image', maxCount: 1 }]), blogController.create);

/**
 * @swagger
 * /api/blog/edit/{id}:
 *   put:
 *     summary: Update a blog (admin only)
 *     tags: [Blogs]
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
 *               shortDescription:
 *                 type: string
 *               content:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 */
router.put('/edit/:id', authenticateJWT, upload.fields([{ name: 'image', maxCount: 1 }]), blogController.edit);

/**
 * @swagger
 * /api/blog/delete/{id}:
 *   delete:
 *     summary: Delete a blog (admin only)
 *     tags: [Blogs]
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
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/delete/:id', authenticateJWT, blogController.delete);

module.exports = router;
