const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');
const upload = require('../middlewares/multer');

const uploadFields = upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]);

router.post('/', uploadFields, freelancerController.create);
router.post('/create', uploadFields, freelancerController.create);
router.get('/list', freelancerController.list);
router.get('/:id', freelancerController.findById);

module.exports = router;
