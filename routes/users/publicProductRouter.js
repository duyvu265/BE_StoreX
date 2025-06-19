import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  getHotProducts,
  getSaleProducts,
  getNewProducts,
  getProductsByCategory
} from '../../controllers/productsController.js';
import { getAllProductVariants, getProductVariantById, getProductVariantBySku, getVariantsByProductId } from '../../controllers/productVariants.js';


const router = express.Router();

// Lấy danh sách sản phẩm
router.get('/', getAllProducts);

// Lấy sản phẩm hot
router.get('/hot', getHotProducts);

// Lấy sản phẩm đang giảm giá
router.get('/sale', getSaleProducts);

// Lấy sản phẩm mới
router.get('/new', getNewProducts);

// Lấy sản phẩm theo danh mục
router.get('/category/:category_id', getProductsByCategory);

// Lấy sản phẩm theo ID
router.get('/:id', getProductById);

// Lấy sản phẩm theo slug
router.get('/slug/:slug', getProductBySlug);

// Product variant
router.get('/product-variants', getAllProductVariants);
router.get('/:product_id/variants', getVariantsByProductId);
router.get('/product-variants/:id', getProductVariantById);
router.get('/product-variants/sku/:sku', getProductVariantBySku);

export default router;
