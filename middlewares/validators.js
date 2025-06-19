import { body, validationResult } from 'express-validator';

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation cho đăng ký
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Họ tên phải có ít nhất 2 ký tự'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  handleValidationErrors
];

// Validation cho đăng nhập
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu'),
  handleValidationErrors
]; 