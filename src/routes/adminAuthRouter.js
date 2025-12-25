const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const upload = require('../middlewares/multer');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

router.post('/register', authenticateJWT, adminAuthController.register);
router.post('/login', authenticateJWT, adminAuthController.login);

module.exports = router;