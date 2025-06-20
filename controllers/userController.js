import { User, UserProfile, UserSettings, UserStats, Wishlist, Cart, Product } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import passport from 'passport';
import admin from '../config/firebaseAdmin.js';
import { generateTokenPair } from '../middlewares/refreshToken.js';
import nodemailer from 'nodemailer';

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

    const userId = decoded.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Gửi email reset password
export const sendResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Không tiết lộ email không tồn tại
      return res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
    }
    // Tạo token reset password (JWT, hết hạn 15 phút)
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    // Link reset (FE sẽ nhận link này qua email)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

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
        from: process.env.SMTP_FROM || 'no-reply@storex.com',
        to: email,
        subject: 'Đặt lại mật khẩu StoreX',
        html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào link dưới đây để đặt lại mật khẩu (có hiệu lực 15 phút):</p><p><a href="${resetLink}">${resetLink}</a></p>`
      });
      console.log("sent ok");
      
    } else {
      // Nếu chưa cấu hình SMTP, chỉ log ra console
      console.log('Link reset password:', resetLink);
    }
    res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
