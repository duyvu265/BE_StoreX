import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../controllers/wishlistController.js';
import { authenticateWithRefresh } from '../../middlewares/refreshToken.js';

const router = express.Router();

// Lấy danh sách wishlist
router.get('/', authenticateWithRefresh,getWishlist);
// Thêm sản phẩm vào wishlist
router.post('/', authenticateWithRefresh, addToWishlist);
// Xóa sản phẩm khỏi wishlist
router.delete('/:productId', authenticateWithRefresh, removeFromWishlist);

export default router; 