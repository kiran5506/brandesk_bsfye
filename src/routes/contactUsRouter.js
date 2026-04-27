const express = require('express');
const router = express.Router();
const contactUsController = require('../controllers/contactUsController');

/**
 * Public contact route
 */
router.post('/contact', contactUsController.contact);

module.exports = router;
