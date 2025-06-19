import express from 'express';
import { getAllCategories, getCategoryById } from '../../controllers/categoryController.js';


const router = express.Router();

// FE chỉ cần đọc dữ liệu
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

export default router;
