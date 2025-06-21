import { User, UserProfile, UserSettings, UserStats, Wishlist, Cart, Product } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import passport from 'passport';
import admin from '../config/firebaseAdmin.js';
import { generateTokenPair } from '../middlewares/refreshToken.js';
import nodemailer from 'nodemailer';

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

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
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

    res.status(201).json({
      message: 'Tạo người dùng thành công',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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

    res.json({
      total: count,
      total_pages: Math.ceil(count / limit),
      current_page: parseInt(page),
      users: rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
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

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra email mới có bị trùng không
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
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

    res.json({
      message: 'Cập nhật thành công',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa người dùng
export const deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    await user.destroy({ transaction });
    await transaction.commit();

    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
      return res.status(401).json({
        "success": false,
        "message": "Email hoặc mật khẩu không đúng"
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        "success": false,
        "message": "Email hoặc mật khẩu không đúng"
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      return res.status(401).json({
        "success": false,
        message: 'Tài khoản không hoạt động'
      });
    }

    // Tạo accessToken và refreshToken
    const { accessToken, refreshToken } = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      user_type: 'user'
    });

    res.json({
      message: 'Đăng nhập thành công',
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
    });
  } catch (error) {
    res.status(500).json({
      "success": false,
      "message": "Lỗi server",
      "error": "..."
    });

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
      return res.status(404).json({ message: 'Không tìm thấy người dùng 4' });
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
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Cập nhật mật khẩu
    await user.update({ password: hashedPassword });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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

    res.json({
      message: 'Cập nhật profile thành công',
      profile: {
        address: userProfile.address,
        bio: userProfile.Bio,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        gender: userProfile.gender,
        birth_date: userProfile.birth_date,
        phone: userProfile.phone
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Đăng xuất
export const logout = async (req, res) => {
  try {
    // Trong trường hợp sử dụng JWT, không cần xử lý gì thêm
    // Nếu sử dụng session, cần xóa session ở đây
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xử lý callback từ Google OAuth
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Đăng nhập Google thất bại' });
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
        full_name: user.full_name
      }
    });
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

    res.json({
      message: 'Đăng nhập Google thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Reset password bằng token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu token hoặc mật khẩu mới'
      });
    }

    // Verify token (giả sử token là JWT, chứa { id })
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Kiểm tra type token
    if (decoded.type !== 'reset_password') {
      console.log('❌ Token không đúng loại:', decoded.type);
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const userId = decoded.id;
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ Không tìm thấy user với ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra email trong token có khớp với user không
    if (decoded.email !== user.email) {
      console.log('❌ Email trong token không khớp:', decoded.email, 'vs', user.email);
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Kiểm tra độ mạnh mật khẩu
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự'
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });

    // Log hoạt động reset password
    console.log(`✅ Reset password thành công cho user: ${user.email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('❌ Lỗi khi reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Gửi email reset password với template đẹp
export const sendResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }

    // Rate limiting theo IP
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();

    if (!ipRateLimit[clientIP] || now > ipRateLimit[clientIP].resetTime) {
      ipRateLimit[clientIP] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    }

    if (ipRateLimit[clientIP].count >= MAX_REQUESTS_PER_HOUR) {
      const waitTime = Math.ceil((ipRateLimit[clientIP].resetTime - now) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${waitTime} phút.`
      });
    }
    ipRateLimit[clientIP].count++;

    // Check cooldown cho email cụ thể
    if (emailCooldownMap[email] && now - emailCooldownMap[email] < EMAIL_COOLDOWN_MS) {
      const wait = Math.ceil((EMAIL_COOLDOWN_MS - (now - emailCooldownMap[email])) / 1000);
      return res.status(429).json({
        success: false,
        message: `Vui lòng kiểm tra email hoặc thử lại sau ${wait} giây.`
      });
    }

    // Check giới hạn số email mỗi ngày
    const today = new Date().toDateString();
    if (!emailDailyCount[email] || emailDailyCount[email].date !== today) {
      emailDailyCount[email] = { count: 0, date: today };
    }

    if (emailDailyCount[email].count >= MAX_EMAILS_PER_DAY) {
      return res.status(429).json({
        success: false,
        message: 'Đã đạt giới hạn số lần gửi email hôm nay. Vui lòng thử lại vào ngày mai.'
      });
    }

    // Cập nhật thời gian gửi gần nhất và số lần gửi
    emailCooldownMap[email] = now;
    emailDailyCount[email].count++;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Không tiết lộ email không tồn tại
      return res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
    }

    // Xóa token reset password cũ nếu có (từ bảng RefreshToken hoặc cache)
    // Điều này đảm bảo chỉ có token mới nhất hoạt động
    try {
      // Có thể xóa token cũ từ database nếu lưu ở đó
      // await RefreshToken.destroy({ where: { user_id: user.id, type: 'reset_password' } });
    } catch (error) {
      console.log('Không thể xóa token cũ:', error.message);
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
    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu - StoreX</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .email-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .email-header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .email-header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .email-body {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            
            .content {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                text-align: center;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            
            .alternative-link {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            
            .alternative-link p {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
            }
            
            .alternative-link a {
                color: #667eea;
                word-break: break-all;
                font-size: 14px;
            }
            
            .warning-box {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            
            .warning-box .warning-icon {
                color: #f39c12;
                font-size: 20px;
                margin-right: 10px;
            }
            
            .warning-box p {
                color: #856404;
                font-size: 14px;
                margin: 0;
            }
            
            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .footer .company-info {
                font-weight: 600;
                color: #495057;
            }
            
            .security-tips {
                background-color: #e8f4fd;
                border: 1px solid #b8daff;
                border-radius: 6px;
                padding: 20px;
                margin: 30px 0;
            }
            
            .security-tips h3 {
                color: #0c5460;
                font-size: 16px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
            }
            
            .security-tips ul {
                color: #0c5460;
                font-size: 14px;
                padding-left: 20px;
            }
            
            .security-tips li {
                margin-bottom: 8px;
            }
            
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .email-header, .email-body, .footer {
                    padding: 20px;
                }
                
                .email-header h1 {
                    font-size: 24px;
                }
                
                .reset-button {
                    display: block;
                    width: 100%;
                    text-align: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <h1>🔐 StoreX</h1>
                <p>Yêu cầu đặt lại mật khẩu</p>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <div class="greeting">
                    Xin chào ${user.full_name || user.email || 'bạn'},
                </div>
                
                <div class="content">
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản StoreX của bạn. 
                    Để bảo mật tài khoản, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới.
                </div>
                
                <div class="button-container">
                    <a href="${resetLink}" class="reset-button">
                        🔑 Đặt lại mật khẩu
                    </a>
                </div>
                
                <div class="alternative-link">
                    <p><strong>Nút không hoạt động?</strong> Sao chép và dán liên kết sau vào trình duyệt:</p>
                    <a href="${resetLink}">${resetLink}</a>
                </div>
                
                <div class="warning-box">
                    <p>
                        <span class="warning-icon">⚠️</span>
                        <strong>Lưu ý quan trọng:</strong> Liên kết này sẽ hết hạn sau 15 phút kể từ khi nhận email này. 
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                </div>
                
                <div class="security-tips">
                    <h3>🛡️ Mẹo bảo mật:</h3>
                    <ul>
                        <li>Sử dụng mật khẩu mạnh có ít nhất 8 ký tự</li>
                        <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                        <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                        <li>Thay đổi mật khẩu định kỳ để bảo vệ tài khoản</li>
                    </ul>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p class="company-info">StoreX - Nền tảng thương mại điện tử hàng đầu</p>
                <p>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</p>
                <p>Nếu cần hỗ trợ, liên hệ: <a href="mailto:support@storex.com">support@storex.com</a></p>
                <p style="margin-top: 20px; font-size: 12px;">
                    © ${new Date().getFullYear()} StoreX. Tất cả quyền được bảo lưu.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

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
 Xin chào ${user.full_name || user.email || 'bạn'},
 
 Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản StoreX của bạn.
 
 Để đặt lại mật khẩu, vui lòng truy cập liên kết sau:
 ${resetLink}
 
 Lưu ý: Liên kết này sẽ hết hạn sau 15 phút.
 
 Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
 
 Trân trọng,
 Đội ngũ StoreX
         `
      });

      console.log(`✅ Email reset password đã được gửi thành công đến: ${email}`);
    } else {
      // Nếu chưa cấu hình SMTP, chỉ log ra console
      console.log('🔗 Link reset password:', resetLink);
      console.log('📧 Email template đã được tạo (chưa gửi do thiếu cấu hình SMTP)');
    }

    res.json({
      success: true,
      message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.'
    });

  } catch (error) {
    console.error('❌ Lỗi khi gửi email reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};