import express from 'express';
import { getAllAddressesAdmin, deleteAddressAdmin } from '../../controllers/userAddressController.js';
import { authenticateToken } from '../../middlewares/auth.js';
import {authorizeAdmin} from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

router.get('/', getAllAddressesAdmin);
router.delete('/:id', deleteAddressAdmin);

export default router; 