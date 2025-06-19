import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { sequelize } from '../config/database.js';

// Lấy danh sách wishlist của user
export const getWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const wishlistItems = await Wishlist.findAll({
      where: { user_id: userId },
      include: [{ model: Product }],
      order: [['createdAt', 'DESC']]
    });
    res.json({
      message: 'Lấy danh sách wishlist thành công',
      wishlist: wishlistItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Thêm sản phẩm vào wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { product_id } = req.body;
    // Kiểm tra đã tồn tại
    const exists = await Wishlist.findOne({ where: { user_id: userId, product_id } });
    if (exists) {
      return res.status(400).json({ message: 'Sản phẩm đã có trong wishlist' });
    }
    const wishlistItem = await Wishlist.create({ user_id: userId, product_id });
    res.status(201).json({
      message: 'Thêm vào wishlist thành công',
      wishlistItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa sản phẩm khỏi wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { product_id } = req.body;
    const deleted = await Wishlist.destroy({ where: { user_id: userId, product_id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong wishlist' });
    }
    res.json({ message: 'Xóa sản phẩm khỏi wishlist thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 