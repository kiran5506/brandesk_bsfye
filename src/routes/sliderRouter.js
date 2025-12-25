const express = require('express');
const sliderController = require('../controllers/sliderController');
const upload = require('../middlewares/multer');
const router = express.Router();
const authenticateJWT =  require('../middlewares/authToken');

router.post('/create', authenticateJWT, upload.fields([
    { name: 'bannerDesktop', maxCount: 1 },
    { name: 'bannerMobile', maxCount: 1 }
]), sliderController.create);
router.put('/edit/:id', authenticateJWT, upload.fields([
    { name: 'bannerDesktop', maxCount: 1 },
    { name: 'bannerMobile', maxCount: 1 }
]), sliderController.edit);
router.delete('/delete/:id', authenticateJWT, sliderController.delete);
router.get('/list', sliderController.list);
router.get('/findById/:id', sliderController.findById);

module.exports = router;