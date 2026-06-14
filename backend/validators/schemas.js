const Joi = require('joi');
const { AppError } = require('../middleware/errorHandler');

const schemas = {
  register: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Admin', 'Manager', 'HR', 'Employee').default('Employee'),
    departmentId: Joi.string().guid({ version: 'uuidv4' }).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().allow('', null),
    salary: Joi.number().min(0).default(0.00),
    hireDate: Joi.date().iso().default(() => new Date()),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string().allow('', null),
    salary: Joi.number().min(0),
    avatarUrl: Joi.string().uri().allow('', null),
    documentUrls: Joi.array().items(Joi.string().uri()),
    skills: Joi.array().items(Joi.string().min(1)),
  }),

  applyLeave: Joi.object({
    leaveTypeId: Joi.string().guid({ version: 'uuidv4' }).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
      .messages({ 'date.min': 'End date must be greater than or equal to start date' }),
    reason: Joi.string().min(5).max(500).required(),
  }),

  processLeave: Joi.object({
    action: Joi.string().valid('Approved', 'Rejected').required(),
    comments: Joi.string().max(500).allow('', null),
  }),

  createAsset: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    serial_number: Joi.string().min(2).max(100).required(),
    type: Joi.string().min(2).max(100).required(),
    status: Joi.string().valid('Available', 'Allocated', 'Maintenance', 'Retired').default('Available'),
  }),

  updateAsset: Joi.object({
    name: Joi.string().min(2).max(100),
    serial_number: Joi.string().min(2).max(100),
    type: Joi.string().min(2).max(100),
    status: Joi.string().valid('Available', 'Allocated', 'Maintenance', 'Retired'),
  }),

  allocateAsset: Joi.object({
    userId: Joi.string().guid({ version: 'uuidv4' }).required(),
    notes: Joi.string().max(500).allow('', null),
  }),
};

const validateBody = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new AppError(`Validation schema '${schemaName}' not found.`, 500));
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(message, 400));
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateBody,
  schemas,
};
