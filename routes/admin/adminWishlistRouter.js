import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../controllers/wishlistController.js';
import { authenticateWithRefresh } from '../../middlewares/refreshToken.js';
import { authorizeAdmin } from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

// Tất cả routes đều cần xác thực admin
router.use(authenticateWithRefresh, authorizeAdmin);

// Lấy wishlist của user bất kỳ
router.get('/:userId', getWishlist);
// Thêm sản phẩm vào wishlist của user bất kỳ
router.post('/:userId', addToWishlist);
// Xóa sản phẩm khỏi wishlist của user bất kỳ
router.delete('/:userId', removeFromWishlist);

export default router; 