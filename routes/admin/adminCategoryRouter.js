import express from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import { authorizeAdmin } from '../../middlewares/authorizeAdmin.js';
import { createCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from '../../controllers/categoryController.js';

const router = express.Router();

// Áp dụng middleware cho toàn bộ CMS routes
router.use(authenticateToken, authorizeAdmin);

router.post('/', createCategory);
router.get('/', getAllCategories);  // Optional: nếu CMS cần xem danh sách
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
