const express = require('express');
const router = express.Router();
const businessProfileController = require('../controllers/businessProfileController');
const upload = require('../middlewares/multer');

// Create business profile
router.post('/create', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'registrationCopy', maxCount: 1 },
    { name: 'gst', maxCount: 1 }
]), businessProfileController.create);

// Get all business profiles
router.get('/list', businessProfileController.list);

// Get business profile by ID
router.get('/findById/:id', businessProfileController.findById);

// Get business profiles by vendor ID
router.get('/findByVendorId/:vendor_id', businessProfileController.findByVendorId);

// Update business profile
router.put('/edit/:id', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'registrationCopy', maxCount: 1 },
    { name: 'gst', maxCount: 1 }
]), businessProfileController.edit);

// Delete business profile
router.delete('/delete/:id', businessProfileController.delete);

module.exports = router;
