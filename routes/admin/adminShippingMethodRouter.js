import express from 'express';
import { getAllShippingMethods, getShippingMethodById, createShippingMethod, updateShippingMethod, deleteShippingMethod } from '../../controllers/shippingMethodController.js';
import { authenticateToken } from '../../middlewares/auth.js';
import {authorizeAdmin} from '../../middlewares/authorizeAdmin.js';

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

router.get('/', getAllShippingMethods);
router.get('/:id', getShippingMethodById);
router.post('/', createShippingMethod);
router.put('/:id', updateShippingMethod);
router.delete('/:id', deleteShippingMethod);

export default router; 