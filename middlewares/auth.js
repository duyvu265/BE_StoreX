import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin.js';
export const authenticateToken = (req, res, next) => {


  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};




// Middleware xác thực token Google
export const verifyGoogleToken = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Không tìm thấy token' });
    }

    // Xác thực token với Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);


    // Lưu thông tin user vào request để sử dụng ở các middleware tiếp theo
    req.decodedToken = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware xác thực JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
}; 
