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
import { authorizeAdmin } from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

// Tất cả routes đều cần xác thực admin
router.use(authenticateToken, authorizeAdmin);

// Lấy giỏ hàng của user bất kỳ
router.get('/:userId', getCart);
// Thêm sản phẩm vào giỏ hàng của user bất kỳ
router.post('/:userId/add', addToCart);
// Cập nhật sản phẩm trong giỏ hàng của user bất kỳ
router.put('/:userId/:id', updateCartItem);
// Xóa sản phẩm khỏi giỏ hàng của user bất kỳ
router.delete('/:userId/:id', removeFromCart);
// Xóa tất cả sản phẩm trong giỏ hàng của user bất kỳ
router.delete('/:userId', clearCart);
// Chọn/bỏ chọn sản phẩm trong giỏ hàng của user bất kỳ
router.patch('/:userId/:id/toggle', toggleCartItemSelection);

export default router; 