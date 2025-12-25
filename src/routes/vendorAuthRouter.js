const express = require('express');
const vendorAuthController = require('../controllers/vendorAuthController');
const upload = require('../middlewares/multer');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

router.post('/register', authenticateJWT, vendorAuthController.register);
router.post('/login', authenticateJWT, vendorAuthController.login);

module.exports = router;