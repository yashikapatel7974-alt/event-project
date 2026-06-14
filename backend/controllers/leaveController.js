const leaveService = require('../services/leaveService');
const { AppError } = require('../middleware/errorHandler');

const getBalances = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const balances = await leaveService.getLeaveBalances(userId);
    return res.status(200).json({
      status: 'success',
      data: { balances },
    });
  } catch (error) {
    next(error);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const { page, limit, userId, status, departmentName } = req.query;

    // Regular employees can only see their own applications
    let targetUserId = userId;
    if (req.user.role === 'Employee') {
      targetUserId = req.user.id;
    }

    const applications = await leaveService.getLeaveApplications({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      userId: targetUserId || '',
      status: status || '',
      departmentName: departmentName || '',
    });

    return res.status(200).json({
      status: 'success',
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const application = await leaveService.applyLeave(req.user.id, req.body);
    return res.status(201).json({
      status: 'success',
      data: { leaveApplication: application },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const processLeave = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { action, comments } = req.body;

    const application = await leaveService.processLeaveApplication(
      applicationId,
      req.user.id,
      { action, comments }
    );

    return res.status(200).json({
      status: 'success',
      message: `Leave application has been ${action.toLowerCase()} successfully.`,
      data: { leaveApplication: application },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const getLeaveTypes = async (req, res, next) => {
  try {
    const leaveTypes = await leaveService.getLeaveTypes();
    return res.status(200).json({
      status: 'success',
      data: { leaveTypes },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalances,
  getApplications,
  applyLeave,
  processLeave,
  getLeaveTypes,
};
