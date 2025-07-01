import express from 'express';
import { createOrder, getOrdersByUser, getOrderDetail } from '../../controllers/orderController.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Đặt hàng
router.post('/', authenticateToken, createOrder);
// Lấy danh sách đơn hàng của user
router.get('/', authenticateToken, getOrdersByUser);
// Lấy chi tiết đơn hàng của user
router.get('/:order_id', authenticateToken, getOrderDetail);

export default router; 