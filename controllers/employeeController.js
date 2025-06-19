import { Op } from 'sequelize';
import Employee from '../models/Employee.js';
import bcrypt from 'bcryptjs';

// Lấy danh sách nhân viên
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy chi tiết 1 nhân viên
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo mới nhân viên
export const createEmployee = async (req, res) => {
  try {
    const newEmployee = await Employee.create(req.body);
    res.status(201).json({ message: 'Tạo nhân viên thành công', employee: newEmployee });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật thông tin nhân viên
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    await employee.update(req.body);
    res.json({ message: 'Cập nhật nhân viên thành công', employee });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa nhân viên
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    await employee.destroy();
    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tìm kiếm, filter, phân trang nhân viên
export const searchEmployees = async (req, res) => {
  try {
    const { name, email, department, position, status, page = 1, limit = 10 } = req.query;
    const where = {};
    if (name) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${name}%` } },
        { last_name: { [Op.like]: `%${name}%` } }
      ];
    }
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (department) where.department = department;
    if (position) where.position = position;
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await Employee.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    res.json({ employees: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật trạng thái nhân viên
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    employee.status = status;
    await employee.save();
    res.json({ message: 'Cập nhật trạng thái thành công', employee });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Cập nhật lương nhân viên
export const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary } = req.body;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    employee.salary = salary;
    await employee.save();
    res.json({ message: 'Cập nhật lương thành công', employee });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách nhân viên theo phòng ban
export const getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await Employee.findAll({ where: { department } });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách nhân viên theo vị trí
export const getEmployeesByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    const employees = await Employee.findAll({ where: { position } });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Thống kê tổng số nhân viên, theo trạng thái, phòng ban, vị trí
export const countEmployees = async (req, res) => {
  try {
    const total = await Employee.count();
    const byStatus = await Employee.findAll({
      attributes: ['status', [Employee.sequelize.fn('COUNT', Employee.sequelize.col('status')), 'count']],
      group: ['status']
    });
    const byDepartment = await Employee.findAll({
      attributes: ['department', [Employee.sequelize.fn('COUNT', Employee.sequelize.col('department')), 'count']],
      group: ['department']
    });
    const byPosition = await Employee.findAll({
      attributes: ['position', [Employee.sequelize.fn('COUNT', Employee.sequelize.col('position')), 'count']],
      group: ['position']
    });
    res.json({ total, byStatus, byDepartment, byPosition });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Supper admin reset mật khẩu cho employee khác
export const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    employee.password = hashed;
    await employee.save();
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 