import express from 'express';
import {
  createReview,
  getReviewsByProduct,
  deleteReview,
  addReply,
  deleteReply,
  getReplies,
  likeReview,
  unlikeReview,
  checkReviewLiked
} from '../../controllers/productReviewController.js';

const router = express.Router();

// Lấy danh sách review cho 1 sản phẩm
router.get('/:product_id/reviews', getReviewsByProduct);

// Tạo review mới cho 1 sản phẩm
router.post('', createReview);

// Xóa review
router.delete('/:review_id/reviews', deleteReview);

// Thêm reply cho review
router.post('/:product_id/reviews/:review_id/replies', addReply);

// Xóa reply
router.delete('/products/:product_id/reviews/:review_id/replies/:reply_id', deleteReply);

// Lấy danh sách reply của 1 review
router.get('/products/:product_id/reviews/:review_id/replies', getReplies);

// Like review
router.post('/reviews/:review_id/like', likeReview);

// Unlike review
router.delete('/reviews/:review_id/like', unlikeReview);

// Check if user has liked the review
router.get('/reviews/:review_id/like', checkReviewLiked);

export default router;