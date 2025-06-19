import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  updateEmployeeStatus,
  updateEmployeeSalary,
  getEmployeesByDepartment,
  getEmployeesByPosition,
  countEmployees,
  resetEmployeePassword
} from '../../controllers/employeeController.js';
import { authenticateToken } from '../../middlewares/auth.js';
import { authorizeAdmin, authorizeSupperAdmin } from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

// Tất cả routes đều cần xác thực admin
router.use(authenticateToken, authorizeAdmin);

// Lấy danh sách nhân viên
router.get('/', getAllEmployees);
// Lấy chi tiết 1 nhân viên
router.get('/:id', getEmployeeById);
// Tạo mới nhân viên
router.post('/', createEmployee);
// Cập nhật nhân viên
router.put('/:id', updateEmployee);
// Xóa nhân viên
router.delete('/:id', deleteEmployee);

// Tìm kiếm, filter, phân trang
router.get('/search/advanced', searchEmployees);
// Cập nhật trạng thái
router.patch('/:id/status', updateEmployeeStatus);
// Cập nhật lương
router.patch('/:id/salary', updateEmployeeSalary);
// Lấy theo phòng ban
router.get('/department/:department', getEmployeesByDepartment);
// Lấy theo vị trí
router.get('/position/:position', getEmployeesByPosition);
// Thống kê
router.get('/stats/count', countEmployees);

// Supper admin reset mật khẩu cho employee khác
router.patch('/:id/reset-password', authorizeSupperAdmin, resetEmployeePassword);

export default router; 