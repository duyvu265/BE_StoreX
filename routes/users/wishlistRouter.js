import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../controllers/wishlistController.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Lấy danh sách wishlist
router.get('/', authenticateToken, getWishlist);
// Thêm sản phẩm vào wishlist
router.post('/', authenticateToken, addToWishlist);
// Xóa sản phẩm khỏi wishlist
router.delete('/', authenticateToken, removeFromWishlist);

export default router; 