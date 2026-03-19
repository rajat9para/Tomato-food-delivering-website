import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import { upload } from '../config/multer';
import * as ownerController from '../controllers/ownerController';

const router = Router();

router.use(auth, authorize('owner'));

router.post('/restaurant', ownerController.createRestaurant);
router.get('/restaurant', ownerController.getMyRestaurant);
router.post('/food', ownerController.addFoodItem);
router.get('/food', ownerController.getMyFoodItems);
router.patch('/food/:id', ownerController.updateFoodItem);
router.delete('/food/:id', ownerController.deleteFoodItem);
router.get('/orders', ownerController.getMyOrders);
router.patch('/orders/:id', ownerController.updateOrderStatus);
router.get('/revenue', ownerController.getMyRevenue);
router.delete('/account', ownerController.deleteAccount);
router.patch('/restaurant/image', ownerController.updateRestaurantImage);
router.patch('/restaurant/details', ownerController.updateRestaurantDetails);
router.patch('/restaurant/toggle-status', ownerController.toggleActiveStatus);
router.get('/messages', ownerController.getMyMessages);
router.patch('/messages/:id/read', ownerController.markMessageRead);
router.get('/messages/unread-count', ownerController.getUnreadMessageCount);

export default router;
