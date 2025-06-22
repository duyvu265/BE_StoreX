import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Middleware để chuẩn hóa response format
 * Tự động wrap response data với format chuẩn
 */
export const responseMiddleware = (req, res, next) => {
  // Lưu reference đến res.json gốc
  const originalJson = res.json;

  // Override res.json để tự động format response
  res.json = function (data) {
    // Nếu response đã có format chuẩn (có success field), trả về nguyên bản
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    // Nếu là error response (status code >= 400)
    if (res.statusCode >= 400) {
      return originalJson.call(this, errorResponse(
        data?.message || 'An error occurred',
        res.statusCode,
        data?.errors || null
      ));
    }

    // Nếu là success response, wrap với format chuẩn
    return originalJson.call(this, successResponse(data));
  };

  next();
};

/**
 * Middleware để xử lý lỗi global
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} already exists`,
      value: e.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found',
      errors: [{
        field: err.fields.join(', '),
        message: 'Referenced record does not exist'
      }],
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: process.env.NODE_ENV === 'development' ? [err.message] : null,
    timestamp: new Date().toISOString()
  });
}; 