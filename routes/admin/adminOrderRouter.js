import express from 'express';
import { getAllOrders, getOrderDetailAdmin, updateOrderStatus, deleteOrder } from '../../controllers/orderController.js';
import { authenticateToken } from '../../middlewares/auth.js';
import {authorizeAdmin} from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

// Middleware xác thực admin
router.use(authenticateToken, authorizeAdmin);

// Lấy tất cả đơn hàng
router.get('/', getAllOrders);
// Lấy chi tiết đơn hàng bất kỳ
router.get('/:order_id', getOrderDetailAdmin);
// Cập nhật trạng thái đơn hàng
router.put('/:order_id', updateOrderStatus);
// Xóa đơn hàng
router.delete('/:order_id', deleteOrder);

export default router; 