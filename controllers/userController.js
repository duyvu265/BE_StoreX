import { User, UserProfile, UserSettings, UserStats, Wishlist, Cart, Product } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import passport from 'passport';
import admin from '../config/firebaseAdmin.js';
import { generateTokenPair } from '../middlewares/refreshToken.js';
import nodemailer from 'nodemailer';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  paginatedResponse,
  createPagination
} from '../utils/responseHelper.js';
import { getResetPasswordEmailTemplate } from '../utils/resetPasswordTemplate.js';

// Biến memory cache, production nên dùng Redis
const emailCooldownMap = {}; // { email: timestamp }
const EMAIL_COOLDOWN_MS = 60 * 1000; // 60 giây

// Thêm tracking số lần gửi email mỗi ngày
const emailDailyCount = {}; // { email: { count: number, date: string } }
const MAX_EMAILS_PER_DAY = 5; // Giới hạn 5 email/ngày

// Rate limiting theo IP
const ipRateLimit = {}; // { ip: { count: number, resetTime: number } }
const MAX_REQUESTS_PER_HOUR = 10; // Giới hạn 10 request/giờ cho mỗi IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 giờ

// Tạo người dùng mới
export const createUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      email,
      phone,
      password,
      full_name,
      avatar_url
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(validationErrorResponse([
        'email and password are required'
      ], 'Missing required fields'));
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json(validationErrorResponse([
        'email already exists'
      ], 'Duplicate email'));
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = await User.create({
      email,
      password: hashedPassword,
      full_name: full_name || email.split('@')[0],
      phone,
      avatar: avatar_url,
      status: 'active'
    }, { transaction });

    await transaction.commit();

    // Tạo accessToken và refreshToken
    const { accessToken, refreshToken } = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      user_type: 'user'
    });

    res.status(201).json(successResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      accessToken,
      refreshToken
    }, 'User created successfully'));
  } catch (error) {
    await transaction.rollback();
    res.status(500).json(errorResponse('Error creating user', 500, error.message));
  }
};

// Lấy danh sách người dùng với phân trang và tìm kiếm
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order]]
    });

    const pagination = createPagination(count, page, limit);

    res.json(paginatedResponse(rows, pagination, 'Users retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching users', 500, error.message));
  }
};

// Lấy thông tin chi tiết người dùng
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserProfile,
          attributes: ['address', 'Bio', 'first_name', 'last_name', 'gender', 'birth_date', 'phone']
        },
        {
          model: Wishlist,
          as: 'Wishlists',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'price', 'image_url', 'description', 'status']
          }]
        },
        {
          model: Cart,
          as: 'Carts',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'price', 'image_url', 'description', 'status']
          }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json(notFoundResponse('User'));
    }

    // Format response để bao gồm thông tin từ UserProfile, Wishlist, Cart
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Thông tin từ UserProfile
      address: user.UserProfile?.address || null,
      bio: user.UserProfile?.Bio || null,
      first_name: user.UserProfile?.first_name || null,
      last_name: user.UserProfile?.last_name || null,
      gender: user.UserProfile?.gender || null,
      birth_date: user.UserProfile?.birth_date || null,
      profile_phone: user.UserProfile?.phone || null,
      // Thông tin Wishlist
      wishlist: user.Wishlists || [],
      wishlist_count: user.Wishlists?.length || 0,
      // Thông tin Cart
      cart: user.Carts || [],
      cart_count: user.Carts?.length || 0
    };

    res.json(successResponse(userData, 'User retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching user', 500, error.message));
  }
};

// Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      email,
      phone,
      full_name,
      avatar_url,
      status
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json(notFoundResponse('User'));
    }

    // Kiểm tra email mới có bị trùng không
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json(validationErrorResponse([
          'email already exists'
        ], 'Duplicate email'));
      }
    }

    // Cập nhật thông tin
    await user.update({
      email,
      phone,
      full_name,
      avatar: avatar_url,
      status
    }, { transaction });

    await transaction.commit();

    res.json(successResponse({
      id: user.id,
      email: user.email,
      full_name: user.full_name
    }, 'User updated successfully'));
  } catch (error) {
    await transaction.rollback();
    res.status(500).json(errorResponse('Error updating user', 500, error.message));
  }
};

// Xóa người dùng
export const deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json(notFoundResponse('User'));
    }

    await user.destroy({ transaction });
    await transaction.commit();

    res.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    await transaction.rollback();
    res.status(500).json(errorResponse('Error deleting user', 500, error.message));
  }
};

// Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm người dùng theo email 
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserProfile,
          attributes: ['address', 'Bio', 'first_name', 'last_name', 'gender', 'birth_date', 'phone']
        }]
    });

    if (!user) {
      return res.status(401).json(unauthorizedResponse('Email hoặc mật khẩu không đúng'));
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(unauthorizedResponse('Email hoặc mật khẩu không đúng'));
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      return res.status(401).json(unauthorizedResponse('Tài khoản không hoạt động'));
    }

    // Tạo accessToken và refreshToken
    const { accessToken, refreshToken } = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      user_type: 'user'
    });

    res.json(successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        // Thông tin từ UserProfile
        address: user.UserProfile?.address || null,
        bio: user.UserProfile?.Bio || null,
        first_name: user.UserProfile?.first_name || null,
        last_name: user.UserProfile?.last_name || null,
        gender: user.UserProfile?.gender || null,
        birth_date: user.UserProfile?.birth_date || null,
        profile_phone: user.UserProfile?.phone || null,
      }
    }, 'Login successful'));
  } catch (error) {
    res.status(500).json(errorResponse('Error during login', 500, error.message));
  }
};

// Lấy thông tin người dùng hiện tại
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: UserProfile,
          attributes: ['address', 'Bio', 'first_name', 'last_name', 'gender', 'birth_date', 'phone']
        }
      ]
    });

    if (!user) {
      return res.status(404).json(notFoundResponse('User'));
    }

    // Format response để bao gồm thông tin từ UserProfile
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Thông tin từ UserProfile
      address: user.UserProfile?.address || null,
      bio: user.UserProfile?.Bio || null,
      first_name: user.UserProfile?.first_name || null,
      last_name: user.UserProfile?.last_name || null,
      gender: user.UserProfile?.gender || null,
      birth_date: user.UserProfile?.birth_date || null,
      profile_phone: user.UserProfile?.phone || null,
    };

    res.json(successResponse(userData, 'User profile retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching user profile', 500, error.message));
  }
};

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json(notFoundResponse('User'));
    }

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(unauthorizedResponse('Mật khẩu hiện tại không đúng'));
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Cập nhật mật khẩu
    await user.update({ password: hashedPassword });

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error changing password', 500, error.message));
  }
};

// Cập nhật thông tin profile người dùng
export const updateProfile = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      address,
      bio,
      first_name,
      last_name,
      gender,
      birth_date,
      phone
    } = req.body;

    const userId = req.user.id;

    // Tìm hoặc tạo UserProfile
    let userProfile = await UserProfile.findOne({ where: { user_id: userId } });

    if (!userProfile) {
      // Tạo mới UserProfile nếu chưa có
      userProfile = await UserProfile.create({
        user_id: userId,
        address,
        Bio: bio,
        first_name,
        last_name,
        gender,
        birth_date,
        phone
      }, { transaction });
    } else {
      // Cập nhật UserProfile hiện có
      await userProfile.update({
        address,
        Bio: bio,
        first_name,
        last_name,
        gender,
        birth_date,
        phone
      }, { transaction });
    }

    await transaction.commit();

    res.json(successResponse({
      address: userProfile.address,
      bio: userProfile.Bio,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      gender: userProfile.gender,
      birth_date: userProfile.birth_date,
      phone: userProfile.phone
    }, 'Profile updated successfully'));
  } catch (error) {
    await transaction.rollback();
    res.status(500).json(errorResponse('Error updating profile', 500, error.message));
  }
};

// Đăng xuất
export const logout = async (req, res) => {
  try {
    // Trong trường hợp sử dụng JWT, không cần xử lý gì thêm
    // Nếu sử dụng session, cần xóa session ở đây
    res.json(successResponse(null, 'Logout successful'));
  } catch (error) {
    res.status(500).json(errorResponse('Error during logout', 500, error.message));
  }
};

// Xử lý callback từ Google OAuth
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json(unauthorizedResponse('Google login failed'));
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json(successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    }, 'Google login successful'));
  })(req, res, next);
};

// Đăng nhập bằng Google
export const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Xác thực token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    // Tìm hoặc tạo người dùng
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        full_name: name,
        avatar: picture,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        status: 'active'
      });
    }

    // Tạo accessToken và refreshToken
    const { accessToken, refreshToken } = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      user_type: 'user'
    });

    res.json(successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    }, 'Google login successful'));
  } catch (error) {
    res.status(500).json(errorResponse('Error during Google login', 500, error.message));
  }
};

// Reset password bằng token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json(validationErrorResponse([
        'token and newPassword are required'
      ], 'Missing required fields'));
    }

    // Verify token (giả sử token là JWT, chứa { id })
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json(validationErrorResponse([
        'Token is invalid or expired'
      ], 'Invalid token'));
    }

    // Kiểm tra type token
    if (decoded.type !== 'reset_password') {
      console.log('❌ Token không đúng loại:', decoded.type);
      return res.status(400).json(validationErrorResponse([
        'Token is invalid'
      ], 'Invalid token type'));
    }

    const userId = decoded.id;
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ Không tìm thấy user với ID:', userId);
      return res.status(404).json(notFoundResponse('User'));
    }

    // Kiểm tra email trong token có khớp với user không
    if (decoded.email !== user.email) {
      console.log('❌ Email trong token không khớp:', decoded.email, 'vs', user.email);
      return res.status(400).json(validationErrorResponse([
        'Token is invalid'
      ], 'Token mismatch'));
    }

    // Kiểm tra độ mạnh mật khẩu
    if (newPassword.length < 8) {
      return res.status(400).json(validationErrorResponse([
        'Password must be at least 8 characters'
      ], 'Weak password'));
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });

    // Log hoạt động reset password
    console.log(`✅ Reset password thành công cho user: ${user.email} (ID: ${user.id})`);

    res.json(successResponse(null, 'Password reset successfully'));
  } catch (error) {
    console.error('❌ Lỗi khi reset password:', error);
    res.status(500).json(errorResponse('Error resetting password', 500, error.message));
  }
};

// Gửi email reset password
export const sendResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }

    // Check cooldown
    const now = Date.now();
    if (emailCooldownMap[email] && now - emailCooldownMap[email] < EMAIL_COOLDOWN_MS) {
      const wait = Math.ceil((EMAIL_COOLDOWN_MS - (now - emailCooldownMap[email])) / 1000);
      return res.status(429).json({
        success: false,
        message: `Vui lòng kiểm tra email hoặc thử lại sau ${wait} giây.`
      });
    }
    // Cập nhật thời gian gửi gần nhất
    emailCooldownMap[email] = now;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Không tiết lộ email không tồn tại
      return res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
    }

    // Tạo token reset password (JWT, hết hạn 15 phút)
    const token = jwt.sign(
      {
        id: user.id,
        type: 'reset_password',
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Link reset (FE sẽ nhận link này qua email)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Template email đẹp và chuyên nghiệp
    const emailTemplate = getResetPasswordEmailTemplate({ user, resetLink });

    // Gửi email (dùng nodemailer, nếu chưa cấu hình thì chỉ log ra console)
    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'StoreX Security <no-reply@storex.com>',
        to: email,
        subject: '🔐 Đặt lại mật khẩu StoreX - Yêu cầu bảo mật',
        html: emailTemplate,
        // Thêm text version cho các email client không hỗ trợ HTML
        text: `
        Xin chào ${user.fullName || user.username || 'bạn'},

      Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản StoreX của bạn.

      Để đặt lại mật khẩu, vui lòng truy cập liên kết sau:
      ${resetLink}

      Lưu ý: Liên kết này sẽ hết hạn sau 15 phút.

      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

      Trân trọng,
        Đội ngũ StoreX
        `
      });

    } else {
      // Nếu chưa cấu hình SMTP, chỉ log ra console
      console.log('🔗 Link reset password:', resetLink);
      console.log('📧 Email template đã được tạo (chưa gửi do thiếu cấu hình SMTP)');
    }

    res.json({
      success: true,
      message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.'
    });
    console.log(token);


  } catch (error) {
    console.error('❌ Lỗi khi gửi email reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};