import express from 'express';
import { changePassword, createUser, deleteUser, getMe, getUserById, googleCallback, login, loginWithGoogle, logout, updateUser, updateProfile } from '../../controllers/userController.js';
import admin from '../../config/firebaseAdmin.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { validateLogin, validateRegister } from '../../middlewares/validators.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Đăng ký
router.post('/register', validateRegister, createUser);

// Đăng nhập
router.post('/login', validateLogin, login);

// Đăng nhập bằng Google
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Không tìm thấy token' });
    }

    // Xác thực token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const { email, name, picture, uid } = decodedToken;

    // Tìm user theo email
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Tạo password ngẫu nhiên
      const randomPassword = Math.random().toString(36).slice(-8);

      // Tạo user mới
      user = await User.create({
        email,
        password: randomPassword,
        full_name: name,
        avatar: picture,
        status: 'active',
        is_verified: true,
        provider: 'google'
      });
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Đăng nhập Google thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Google OAuth routes
// router.get('/auth/google', googleLogin);
router.get('/auth/google/callback', googleCallback);

// Các API cần đăng nhập
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

router.post('/change-password', authenticateToken, changePassword);
router.put('/profile', authenticateToken, updateProfile);
// router.post('/:id/verify-email', authenticateToken, verifyEmail);
// router.post('/:id/verify-phone', authenticateToken, verifyPhone);

export default router;
