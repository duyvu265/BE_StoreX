import express from 'express';
import { authenticateWithRefresh } from './../../middlewares/refreshToken.js';
import { authorizeAdmin } from './../../middlewares/authorizeAdmin.js';
import { bulkUpdateProductStatus, createProduct, deleteProduct, updateProduct } from './../../controllers/productsController.js';
import { bulkDeleteVariantsByProductId, bulkUpdateVariantStatus, createProductVariant, deleteProductVariant, updateProductVariant } from './../../controllers/productVariants.js';


const router = express.Router();

router.use(authenticateWithRefresh, authorizeAdmin);

// Product routes
router.post('', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/bulk-status', bulkUpdateProductStatus);

// Product variant routes
router.post('/product-variants', createProductVariant);
router.put('/product-variants/:id', updateProductVariant);
router.delete('/product-variants/:id', deleteProductVariant);
router.patch('/product-variants/bulk-status', bulkUpdateVariantStatus);
router.delete('/:product_id/variants', bulkDeleteVariantsByProductId);

export default router;
