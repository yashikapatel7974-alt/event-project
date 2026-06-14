const employeeService = require('../services/employeeService');
const { AppError } = require('../middleware/errorHandler');

const getDirectory = async (req, res, next) => {
  try {
    const { page, limit, search, departmentId, role } = req.query;
    const directory = await employeeService.getEmployeeDirectory({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      search: search || '',
      departmentId: departmentId || '',
      role: role || '',
    });

    return res.status(200).json({
      status: 'success',
      data: directory,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const profile = await employeeService.getEmployeeProfile(userId);
    return res.status(200).json({
      status: 'success',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Non-admins cannot update salaries
    if (req.user.role !== 'Admin' && req.body.salary !== undefined) {
      delete req.body.salary;
    }

    const updatedProfile = await employeeService.updateEmployeeProfile(userId, req.body, req.user.id);
    return res.status(200).json({
      status: 'success',
      data: { profile: updatedProfile },
    });
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await employeeService.getDepartments();
    return res.status(200).json({
      status: 'success',
      data: { departments },
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return next(new AppError('Department name and code are required.', 400));
    }
    const newDept = await employeeService.createDepartment(name, code, req.user.id);
    return res.status(201).json({
      status: 'success',
      data: { department: newDept },
    });
  } catch (error) {
    next(error);
  }
};

const getSkills = async (req, res, next) => {
  try {
    const skills = await employeeService.getSkills();
    return res.status(200).json({
      status: 'success',
      data: { skills },
    });
  } catch (error) {
    next(error);
  }
};

const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return next(new AppError('isActive status boolean is required.', 400));
    }

    if (employeeId === req.user.id) {
      return next(new AppError('You cannot deactivate your own account.', 400));
    }

    const updatedUser = await employeeService.toggleEmployeeStatus(employeeId, isActive, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: `Employee account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDirectory,
  getProfile,
  updateProfile,
  getDepartments,
  createDepartment,
  getSkills,
  toggleEmployeeStatus,
};
