const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateBody } = require('../validators/schemas');

const router = express.Router();

router.use(protect); // Require auth for all leave actions

router.get('/balances/:userId?', leaveController.getBalances);
router.get('/applications', leaveController.getApplications);
router.get('/types', leaveController.getLeaveTypes);

router.post('/apply', validateBody('applyLeave'), leaveController.applyLeave);

// Manager, HR, and Admin can approve/reject leaves
router.patch('/applications/:applicationId/process', restrictTo('Admin', 'Manager', 'HR'), validateBody('processLeave'), leaveController.processLeave);

module.exports = router;
