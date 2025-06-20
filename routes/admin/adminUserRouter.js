import express from 'express';
import { authenticateWithRefresh } from '../../middlewares/refreshToken.js';
import { authorizeAdmin } from '../../middlewares/authorizeAdmin.js';
import { deleteUser, getUserById, getUsers, updateUser } from './../../controllers/userController.js';


const router = express.Router();

// Gắn middleware cho toàn bộ admin router
router.use(authenticateWithRefresh, authorizeAdmin);

// Danh sách người dùng
router.get('/', getUsers);

// Chi tiết người dùng
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
