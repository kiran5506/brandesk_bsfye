const express = require('express');
const vendorController = require('../controllers/vendorController');
const authenticateJWT = require('../middlewares/authToken');

const router = express.Router();

router.put('/edit/:id', authenticateJWT, vendorController.edit);
router.delete('/delete/:id', authenticateJWT, vendorController.delete);
router.get('/list', authenticateJWT, vendorController.list);
router.get('/view/:id', authenticateJWT, vendorController.view);

module.exports = router;