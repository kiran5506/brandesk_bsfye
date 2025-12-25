const express = require('express');
const authController = require('../controllers/authController');
const mailController = require('../controllers/mailController');
const upload = require('../middlewares/multer');

const router = express.Router();

router.post('/singup', authController.singUp);
router.post('/login', authController.logIn);
router.post('/signout', authController.signOut);
router.post('/generate-token', authController.generateToken);

//send mailing
router.post('/sendmail', mailController.sendMail);

module.exports = router;