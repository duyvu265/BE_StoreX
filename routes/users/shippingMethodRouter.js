import express from 'express';
import { getAllShippingMethods, getShippingMethodById } from '../../controllers/shippingMethodController.js';

const router = express.Router();

router.get('/', getAllShippingMethods);
router.get('/:id', getShippingMethodById);

export default router; 