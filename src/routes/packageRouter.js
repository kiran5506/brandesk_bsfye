const express = require('express');
const packageController = require('../controllers/packageController');

const router = express.Router();

router.post('/create', packageController.create);
router.put('/edit/:id', packageController.edit);
router.delete('/delete/:id', packageController.delete);
router.get('/list', packageController.list);
router.get('/findById/:id', packageController.findById);
router.post('/fetchCourses', packageController.fetchCourses);

module.exports = router;
