const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');

router.post('/create', suggestionController.create);
router.get('/list', suggestionController.list);
router.get('/findById/:id', suggestionController.findById);
router.put('/edit/:id', suggestionController.edit);
router.delete('/delete/:id', suggestionController.delete);

module.exports = router;
