import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import * as riderDashController from '../controllers/riderDashController';

const router = Router();

// All rider dashboard routes require rider authentication
router.use(auth, authorize('rider'));

// Order queue & delivery
router.get('/available-orders', riderDashController.getAvailableOrders);
router.get('/active-delivery', riderDashController.getActiveDelivery);
router.post('/accept-order/:id', riderDashController.acceptOrder);
router.post('/start-delivery/:id', riderDashController.startDelivery);
router.post('/complete-delivery/:id', riderDashController.completeDelivery);
router.get('/my-deliveries', riderDashController.getMyDeliveries);

// Profile & stats
router.get('/profile', riderDashController.getRiderProfile);
router.put('/profile', riderDashController.updateRiderProfile);
router.get('/stats', riderDashController.getRiderStats);

export default router;
