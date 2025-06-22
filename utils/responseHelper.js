/**
 * Helper functions để chuẩn hóa response format cho API
 */

// Response thành công với data
export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Response thành công với pagination
export const paginatedResponse = (data, pagination, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      current_page: pagination.current_page,
      total_pages: pagination.total_pages,
      total_items: pagination.total_items,
      items_per_page: pagination.items_per_page,
      has_next: pagination.current_page < pagination.total_pages,
      has_prev: pagination.current_page > 1
    },
    timestamp: new Date().toISOString()
  };
};

// Response lỗi
export const errorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
};

// Response validation error
export const validationErrorResponse = (errors, message = 'Validation failed') => {
  return {
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  };
};

// Response not found
export const notFoundResponse = (resource = 'Resource') => {
  return {
    success: false,
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  };
};

// Response unauthorized
export const unauthorizedResponse = (message = 'Unauthorized') => {
  return {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
};

// Response forbidden
export const forbiddenResponse = (message = 'Forbidden') => {
  return {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
};

// Helper để tạo pagination object
export const createPagination = (count, page, limit) => {
  return {
    current_page: parseInt(page),
    total_pages: Math.ceil(count / limit),
    total_items: count,
    items_per_page: parseInt(limit)
  };
}; 