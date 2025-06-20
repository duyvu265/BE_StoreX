import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'Không tìm thấy token xác thực',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Xử lý các loại lỗi JWT khác nhau
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token đã hết hạn, vui lòng đăng nhập lại',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token không hợp lệ',
        code: 'INVALID_TOKEN 3'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: 'Token chưa có hiệu lực',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Lỗi khác
    return res.status(403).json({ 
      message: 'Token không hợp lệ hoặc đã hết hạn',
      code: 'TOKEN_ERROR'
    });
  }
};

// Middleware xác thực token Google với xử lý lỗi tốt hơn
export const verifyGoogleToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ 
        message: 'Không tìm thấy token',
        code: 'NO_TOKEN'
      });
    }

    // Xác thực token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Lưu thông tin user vào request để sử dụng ở các middleware tiếp theo
    req.decodedToken = decodedToken;
    next();
  } catch (error) {
    console.error('Google token verification error:', error);
    
    // Xử lý các lỗi Firebase Auth cụ thể
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        message: 'Token Google đã hết hạn',
        code: 'GOOGLE_TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        message: 'Token Google đã bị thu hồi',
        code: 'GOOGLE_TOKEN_REVOKED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        message: 'Token Google không hợp lệ',
        code: 'INVALID_GOOGLE_TOKEN'
      });
    }

    res.status(401).json({ 
      message: 'Token Google không hợp lệ',
      code: 'GOOGLE_TOKEN_ERROR'
    });
  }
};

// Middleware xác thực JWT token với xử lý lỗi cải thiện
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Không tìm thấy token',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Xử lý chi tiết các loại lỗi JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token đã hết hạn, vui lòng đăng nhập lại',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token không hợp lệ',
        code: 'INVALID_TOKEN 2'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: 'Token chưa có hiệu lực',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    return res.status(401).json({ 
      message: 'Lỗi xác thực token',
      code: 'TOKEN_ERROR'
    });
  }
};