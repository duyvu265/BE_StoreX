// middleware/authorizeAdmin.js
import Employee from '../models/Employee.js';

export const authorizeAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.employee_id; // req.user được set từ authenticateToken
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const employee = await Employee.findByPk(userId);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (employee.role !== 'admin' && employee.role !== 'supper_admin') {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi xác thực quyền truy cập', error: error.message });
  }
};

export const authorizeSupperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.employee_id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }
    const employee = await Employee.findByPk(userId);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    if (employee.role !== 'supper_admin') {
      return res.status(403).json({ message: 'Bạn không có quyền supper admin' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi xác thực quyền supper admin', error: error.message });
  }
};
