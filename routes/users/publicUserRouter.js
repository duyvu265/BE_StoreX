import express from 'express';
import { changePassword, createUser, deleteUser, getMe, getUserById, googleCallback, login, loginWithGoogle, logout, updateUser, updateProfile, resetPassword, sendResetPasswordEmail } from '../../controllers/userController.js';
import admin from '../../config/firebaseAdmin.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { validateLogin, validateRegister } from '../../middlewares/validators.js';
import { authenticateWithRefresh } from '../../middlewares/refreshToken.js';
import { refreshTokenEndpoint } from '../../middlewares/refreshToken.js';

const router = express.Router();

// Đăng ký
router.post('/register', validateRegister, createUser);

// Đăng nhập
router.post('/login', validateLogin, login);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', sendResetPasswordEmail);
// Đăng nhập bằng Google
router.post('/google-login', loginWithGoogle);

// Google OAuth routes
// router.get('/auth/google', googleLogin);
router.get('/auth/google/callback', googleCallback);


router.post('/refresh-token', refreshTokenEndpoint);

// Các API cần đăng nhập
router.get('/me', authenticateWithRefresh, getMe);
router.post('/logout', authenticateWithRefresh, logout);
router.get('/:id', authenticateWithRefresh, getUserById);
router.put('/:id', authenticateWithRefresh, updateUser);
router.delete('/:id', authenticateWithRefresh, deleteUser);

router.post('/change-password', authenticateWithRefresh, changePassword);
router.put('/profile', authenticateWithRefresh, updateProfile);
// router.post('/:id/verify-email', authenticateToken, verifyEmail);
// router.post('/:id/verify-phone', authenticateToken, verifyPhone);



export default router;
