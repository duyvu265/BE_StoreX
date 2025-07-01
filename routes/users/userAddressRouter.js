import express from 'express';
import { getUserAddresses, createUserAddress, updateUserAddress, deleteUserAddress, setDefaultUserAddress } from '../../controllers/userAddressController.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserAddresses);
router.post('/', createUserAddress);
router.put('/:id', updateUserAddress);
router.delete('/:id', deleteUserAddress);
router.put('/:id/default', setDefaultUserAddress);

export default router; 