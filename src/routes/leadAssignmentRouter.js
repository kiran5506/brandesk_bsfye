const express = require('express');
const leadAssignmentController = require('../controllers/leadAssignmentController');

const router = express.Router();

router.get('/vendor/:vendorId', leadAssignmentController.listByVendor);
router.get('/admin/leads', leadAssignmentController.listAdminLeads);
router.get('/admin/leads/:inquiryId', leadAssignmentController.getAdminLeadDetails);
router.get('/admin/replacements', leadAssignmentController.listReplacementRequests);
router.get('/admin/replacements/:id', leadAssignmentController.getReplacementRequestDetails);
router.post('/view', leadAssignmentController.markViewed);
router.patch('/:id/status', leadAssignmentController.updateStatus);
router.post('/replace-request', leadAssignmentController.requestReplacement);
router.patch('/replace-request/:id/review', leadAssignmentController.reviewReplacement);

module.exports = router;
