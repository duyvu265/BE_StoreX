import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import { getTokenConfig } from '../config/tokenConfig.js';

// Lấy cấu hình token
const tokenConfig = getTokenConfig();

// Middleware xác thực access token và tự động refresh nếu cần (chỉ cho user)
export const authenticateWithRefresh = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const refreshToken = req.headers['x-refresh-token'];
  if (!token) {
    return res.status(401).json({
      message: 'Không tìm thấy token xác thực',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify access token
    const decoded = jwt.verify(token, tokenConfig.jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    // Nếu access token hết hạn và có refresh token
    if (error.name === 'TokenExpiredError' && refreshToken) {
      try {
        // Verify refresh token
        const refreshDecoded = jwt.verify(refreshToken, tokenConfig.refreshTokenSecret);
        const userId = refreshDecoded.id;
        const storedRefreshToken = await RefreshToken.findOne({
          where: {
            token: refreshToken,
            user_id: userId,
            is_revoked: false
          }
        });
        if (!storedRefreshToken) {
          return res.status(401).json({
            message: 'Refresh token không hợp lệ',
            code: 'INVALID_REFRESH_TOKEN'
          });
        }
        // Tạo access token mới
        const newAccessToken = jwt.sign(
          {
            id: refreshDecoded.id,
            email: refreshDecoded.email,
            role: refreshDecoded.role
          },
          tokenConfig.jwtSecret,
          {
            expiresIn: tokenConfig.accessTokenExpiry,
            issuer: tokenConfig.issuer,
            audience: tokenConfig.audience
          }
        );
        res.setHeader('x-new-token', newAccessToken);
        req.user = {
          id: refreshDecoded.id,
          email: refreshDecoded.email,
          role: refreshDecoded.role
        };
        next();
      } catch (refreshError) {
        return res.status(401).json({
          message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
    } else {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token đã hết hạn, vui lòng đăng nhập lại hoặc refresh token',
          code: 'TOKEN_EXPIRED',
          expiredAt: error.expiredAt
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Token không hợp lệ',
          code: 'INVALID_TOKEN 1'
        });
      }
      return res.status(403).json({
        message: 'Token không hợp lệ hoặc đã hết hạn',
        code: 'TOKEN_ERROR'
      });
    }
  }
};

// Utility function để tạo token pair cho user
export const generateTokenPair = async (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  const config = getTokenConfig();
  const accessToken = jwt.sign(
    payload,
    config.jwtSecret,
    {
      expiresIn: config.accessTokenExpiry,
      issuer: config.issuer,
      audience: config.audience
    }
  );
  const refreshToken = jwt.sign(
    payload,
    config.refreshTokenSecret,
    {
      expiresIn: config.refreshTokenExpiry,
      issuer: config.issuer,
      audience: config.audience
    }
  );
  // Tính toán thời gian hết hạn cho database
  const expiresAt = new Date(Date.now() + (parseInt(config.refreshTokenExpiry) * 1000 || 0));
  await RefreshToken.create({
    token: refreshToken,
    user_id: user.id,
    user_type: 'user',
    expires_at: expiresAt,
    is_revoked: false
  });
  return { accessToken, refreshToken };
};

// API endpoint để refresh token cho user
export const refreshTokenEndpoint = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        message: 'Không tìm thấy refresh token',
        code: 'NO_REFRESH_TOKEN'
      });
    }
    const config = getTokenConfig();
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    const userId = decoded.id;
    if (!userId) {
      return res.status(401).json({
        message: 'Refresh token không hợp lệ',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        user_id: userId,
        is_revoked: false
      }
    });
    if (!storedToken) {
      return res.status(401).json({
        message: 'Refresh token không hợp lệ',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    // Tạo token pair mới cho user
    const newTokens = await generateTokenPair({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });
    // Revoke refresh token cũ
    await RefreshToken.update(
      { is_revoked: true },
      { where: { token: refreshToken } }
    );
    res.json({
      message: 'Token đã được làm mới',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      config: {
        accessTokenExpiry: config.accessTokenExpiry,
        refreshTokenExpiry: config.refreshTokenExpiry
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Refresh token đã hết hạn',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    res.status(401).json({
      message: 'Refresh token không hợp lệ',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};