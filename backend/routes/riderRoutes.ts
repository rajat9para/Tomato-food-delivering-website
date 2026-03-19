import { Router } from 'express';
import * as riderController from '../controllers/riderController';

const router = Router();

// Public rider endpoints
router.get('/', riderController.getAllRiders);
router.get('/:id', riderController.getRiderById);
router.get('/:id/distance', riderController.getRiderDistance);
router.post('/', riderController.createRider);
router.post('/create-demo-riders', riderController.createDemoRiders);
router.patch('/:id/status', riderController.updateRiderStatus);
router.patch('/:id/location', riderController.updateRiderLocation);

export default router;
