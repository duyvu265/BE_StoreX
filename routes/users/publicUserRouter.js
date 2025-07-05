import express from 'express';
import {
  changePassword,
  createUser,
  deleteUser,
  getMe,
  getUserById,
  googleCallback,
  login,
  loginWithGoogle,
  logout,
  updateUser,
  updateProfile,
  resetPassword,
  sendResetPasswordEmail
} from '../../controllers/userController.js';
import { validateLogin, validateRegister } from '../../middlewares/validators.js';
import { authenticateWithRefresh, refreshTokenEndpoint } from '../../middlewares/refreshToken.js';

const router = express.Router();

// ===== Auth & Đăng ký/Đăng nhập =====
router.post('/register', validateRegister, createUser);
router.post('/login', validateLogin, login);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', sendResetPasswordEmail);
router.post('/google-login', loginWithGoogle);
router.get('/auth/google/callback', googleCallback);

// ===== Refresh token =====
router.post('/refresh-token', authenticateWithRefresh, refreshTokenEndpoint);

// ===== Các API cần đăng nhập =====
router.use(authenticateWithRefresh);

router.get('/me', getMe);
router.post('/logout', logout);
router.post('/change-password', changePassword);
router.put('/update-profile', updateProfile);

// ===== User CRUD =====
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// ===== Các route có thể mở rộng trong tương lai =====
// router.post('/:id/verify-email', authenticateToken, verifyEmail);
// router.post('/:id/verify-phone', authenticateToken, verifyPhone);

export default router;
