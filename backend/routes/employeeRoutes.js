const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateBody } = require('../validators/schemas');

const router = express.Router();

router.use(protect); // All employee routes require authentication

router.get('/directory', employeeController.getDirectory);
router.get('/departments', employeeController.getDepartments);
router.get('/skills', employeeController.getSkills);

// Admin only: create department
router.post('/departments', restrictTo('Admin'), employeeController.createDepartment);

// Admin only: toggle active status of employee
router.patch('/:employeeId/status', restrictTo('Admin'), employeeController.toggleEmployeeStatus);

// Profiles: users can get/update their own, Admins/HR/Managers can view others, Admins can update any.
router.get('/:userId?', employeeController.getProfile);
router.put('/:userId?', validateBody('updateProfile'), employeeController.updateProfile);

module.exports = router;
