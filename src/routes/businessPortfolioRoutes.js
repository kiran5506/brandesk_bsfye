const express = require('express');
const businessPortfolioController = require('../controllers/businessPortfolioController');
const upload = require('../middlewares/multer');

const router = express.Router();

router.post('/create', upload.any(), businessPortfolioController.create);
router.get('/vendor/:vendor_id', businessPortfolioController.listByVendor);
router.patch('/delete-media/:id', businessPortfolioController.deleteMedia);
router.patch('/toggle-status/:id', businessPortfolioController.toggleStatus);

module.exports = router;
