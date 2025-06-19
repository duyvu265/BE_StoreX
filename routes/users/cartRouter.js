import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  toggleCartItemSelection
} from '../../controllers/cartController.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticateToken);

// Lấy giỏ hàng
router.get('/', getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', addToCart);

// Cập nhật sản phẩm trong giỏ hàng
router.put('/:id', updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/:id', removeFromCart);

// Xóa tất cả sản phẩm trong giỏ hàng
router.delete('/', clearCart);

// Chọn/bỏ chọn sản phẩm
router.patch('/:id/toggle', toggleCartItemSelection);

export default router; 