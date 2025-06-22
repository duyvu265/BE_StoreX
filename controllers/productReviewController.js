import ProductReview from '../models/ProductReview.js';
import ProductReviewImage from '../models/ProductReviewImage.js';
import ProductReviewReply from '../models/ProductReviewReply.js';
import { Op } from 'sequelize';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/responseHelper.js';

// Thêm review mới (có thể kèm ảnh)
export const createReview = async (req, res) => {
  try {
    const { product_id, user_id, order_id, rating, title, content, is_verified_purchase, images } = req.body;

    // Validation
    if (!product_id || !user_id || !rating || !title || !content) {
      return res.status(400).json(validationErrorResponse([
        'product_id, user_id, rating, title, content are required'
      ], 'Missing required fields'));
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(validationErrorResponse([
        'Rating must be between 1 and 5'
      ], 'Invalid rating'));
    }

    const review = await ProductReview.create({
      product_id, user_id, order_id, rating, title, content, is_verified_purchase
    });

    let imageRecords = [];
    if (Array.isArray(images) && images.length > 0) {
      imageRecords = await ProductReviewImage.bulkCreate(
        images.map(url => ({ review_id: review.review_id, image_url: url }))
      );
    }

    const reviewWithImages = await ProductReview.findByPk(review.review_id, {
      include: [{ model: ProductReviewImage, as: 'images' }]
    });

    res.status(201).json(successResponse(reviewWithImages, 'Review created successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error creating review', 500, error.message));
  }
};

// Lấy danh sách review cho 1 sản phẩm
export const getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { page = 1, limit = 10, rating, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    const offset = (page - 1) * limit;
    const where = { product_id, is_approved: true };

    // Filter by rating
    if (rating) {
      where.rating = parseInt(rating);
    }

    const { count, rows } = await ProductReview.findAndCountAll({
      where,
      include: [{ model: ProductReviewImage, as: 'images' }],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const pagination = {
      current_page: parseInt(page),
      total_pages: Math.ceil(count / limit),
      total_items: count,
      items_per_page: parseInt(limit)
    };

    res.json(successResponse({
      reviews: rows,
      pagination
    }, 'Reviews retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching reviews', 500, error.message));
  }
};

// Xóa review (chỉ chủ review hoặc admin)
export const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const review = await ProductReview.findByPk(review_id);

    if (!review) {
      return res.status(404).json(notFoundResponse('Review'));
    }

    await ProductReviewImage.destroy({ where: { review_id } });
    await review.destroy();

    res.json(successResponse(null, 'Review deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error deleting review', 500, error.message));
  }
};

// Thêm reply cho review
export const addReply = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { user_id, content } = req.body;

    // Validation
    if (!user_id || !content) {
      return res.status(400).json(validationErrorResponse([
        'user_id and content are required'
      ], 'Missing required fields'));
    }

    // Check if review exists
    const review = await ProductReview.findByPk(review_id);
    if (!review) {
      return res.status(404).json(notFoundResponse('Review'));
    }

    const reply = await ProductReviewReply.create({ review_id, user_id, content });

    res.status(201).json(successResponse(reply, 'Reply added successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error adding reply', 500, error.message));
  }
};

// Xóa reply
export const deleteReply = async (req, res) => {
  try {
    const { reply_id } = req.params;
    const reply = await ProductReviewReply.findByPk(reply_id);

    if (!reply) {
      return res.status(404).json(notFoundResponse('Reply'));
    }

    await reply.destroy();

    res.json(successResponse(null, 'Reply deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error deleting reply', 500, error.message));
  }
};

// Lấy danh sách reply của 1 sản phẩm hoặc 1 review
export const getReplies = async (req, res) => {
  try {
    const { product_id, review_id } = req.params;
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'ASC' } = req.query;

    const offset = (page - 1) * limit;
    let where = {};

    if (review_id) {
      where.review_id = review_id;
    } else if (product_id) {
      // Lấy tất cả reply của các review thuộc product_id
      const reviews = await ProductReview.findAll({ where: { product_id } });
      const reviewIds = reviews.map(r => r.review_id);
      where.review_id = reviewIds.length ? reviewIds : 0;
    } else {
      return res.status(400).json(validationErrorResponse([
        'Either product_id or review_id is required'
      ], 'Missing required parameter'));
    }

    const { count, rows } = await ProductReviewReply.findAndCountAll({
      where,
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: ProductReview,
        as: 'review',
        attributes: ['review_id', 'title', 'rating']
      }]
    });

    const pagination = {
      current_page: parseInt(page),
      total_pages: Math.ceil(count / limit),
      total_items: count,
      items_per_page: parseInt(limit)
    };

    res.json(successResponse({
      replies: rows,
      pagination
    }, 'Replies retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Error fetching replies', 500, error.message));
  }
}; 