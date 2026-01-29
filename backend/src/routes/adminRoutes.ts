import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => cb(null, `admin-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.use(auth, authorize('admin'));

router.post('/init', adminController.initializeRestaurants);
router.get('/dashboard', adminController.getDashboard);
router.get('/restaurants/top', adminController.getTopRestaurants);
router.delete('/restaurants/:id', adminController.removeRestaurant);
router.get('/restaurants/search', adminController.searchRestaurants);
router.get('/restaurants', adminController.getRestaurants);
router.patch('/restaurants/:id', adminController.updateRestaurantStatus);
router.post('/restaurants/:id/message', upload.array('files', 5), adminController.sendMessageToOwner);
router.get('/messages/sent', adminController.getSentMessages);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.get('/orders', adminController.getAllOrders);
router.get('/transactions', adminController.getTransactions);
router.get('/revenue', adminController.getRevenueByRestaurant);
router.get('/platform-revenue', adminController.getAdminRevenue);
router.get('/inbox', adminController.getInbox);
router.patch('/inbox/:id', adminController.markMessageRead);

export default router;
