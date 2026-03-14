const express = require('express');
const employeeController = require('../controllers/employeeController');
const authenticateJWT = require('../middlewares/authToken');
const upload = require('../middlewares/multer');

const router = express.Router();

/**
 * @swagger
 * /api/employee/create:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               mobileNumber:
 *                 type: string
 *               alternateMobileNumber:
 *                 type: string
 *               passPhoto:
 *                 type: string
 *                 format: binary
 *               aadharFront:
 *                 type: string
 *                 format: binary
 *               aadharBack:
 *                 type: string
 *                 format: binary
 *               pan:
 *                 type: string
 *               presentAddress:
 *                 type: string
 *               permanentAddress:
 *                 type: string
 *               fatherHusbandWifeName:
 *                 type: string
 *               fatherHusbandWifeMobileNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/create', authenticateJWT, upload.fields([
  { name: 'passPhoto', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'rationCardFront', maxCount: 1 },
  { name: 'higherEducation', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), employeeController.create);

/**
 * @swagger
 * /api/employee/edit/{id}:
 *   put:
 *     summary: Edit an employee
 *     tags: [Employees]
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
 *               name:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               mobileNumber:
 *                 type: string
 *               alternateMobileNumber:
 *                 type: string
 *               passPhoto:
 *                 type: string
 *                 format: binary
 *               aadharFront:
 *                 type: string
 *                 format: binary
 *               aadharBack:
 *                 type: string
 *                 format: binary
 *               pan:
 *                 type: string
 *               presentAddress:
 *                 type: string
 *               permanentAddress:
 *                 type: string
 *               fatherHusbandWifeName:
 *                 type: string
 *               fatherHusbandWifeMobileNumber:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.put('/edit/:id', authenticateJWT, upload.fields([
  { name: 'passPhoto', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'rationCardFront', maxCount: 1 },
  { name: 'higherEducation', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), employeeController.edit);

/**
 * @swagger
 * /api/employee/delete/{id}:
 *   delete:
 *     summary: Delete an employee
 *     tags: [Employees]
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
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', authenticateJWT, employeeController.delete);

/**
 * @swagger
 * /api/employee/list:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *       404:
 *         description: No employees found
 *       500:
 *         description: Server error
 */
router.get('/list', authenticateJWT, employeeController.list);

/**
 * @swagger
 * /api/employee/find/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
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
 *         description: Employee details retrieved successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/find/:id', authenticateJWT, employeeController.findById);

module.exports = router;
