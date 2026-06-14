const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    return res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 401));
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      return next(new AppError('Refresh token is required.', 400));
    }

    const tokens = await authService.verifyRefreshToken(token);
    return res.status(200).json({
      status: 'success',
      data: tokens,
    });
  } catch (error) {
    next(new AppError(error.message, 401));
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    return res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
};
