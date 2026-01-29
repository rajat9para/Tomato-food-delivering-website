import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import * as customerController from '../controllers/customerController';
import multer from 'multer';
import path from 'path';

// Safe upload directory resolution
const getUploadDir = () => {
  const dir = path.join(process.cwd(), 'public/uploads');
  // Ensure directory exists
  try {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 Created uploads directory at:', dir);
    }
  } catch (e) {
    console.error('Error creating upload dir:', e);
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir()),
  filename: (req, file, cb) => cb(null, `contact-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir()),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}-${file.originalname}`)
});
const profileUpload = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

const ratingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadDir();
    console.log('📁 Rating upload destination resolved to:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = `rating-${Date.now()}-${file.originalname}`;
    console.log('📄 Rating file processing:', filename);
    cb(null, filename);
  }
});
const ratingUpload = multer({ storage: ratingStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(auth, authorize('customer'));

router.get('/restaurants', customerController.getRestaurants);
router.get('/best-restaurants', customerController.getBestRestaurants);
router.get('/featured-dishes', customerController.getFeaturedDishes);
router.get('/best-dishes', customerController.getBestDishes);
router.get('/great-deals', customerController.getGreatDeals);
router.get('/search-dishes', customerController.searchDishes);
router.get('/restaurants/:id/menu', customerController.getRestaurantMenu);
router.get('/restaurants/:id/reviews', customerController.getRestaurantReviews);
router.post('/orders', customerController.placeOrder);
router.get('/orders', customerController.getMyOrders);
router.post('/orders/cancel', customerController.cancelOrder);
router.post('/orders/rate', (req, res, next) => {
  ratingUpload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer Error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('❌ Unknown Upload Error:', err);
      return res.status(500).json({ message: `Upload error: ${err.message}` });
    }
    next();
  });
}, customerController.rateOrder);
router.delete('/orders/:orderId/rating', customerController.removeRating);
router.get('/profile', customerController.getProfile);
router.put('/profile', profileUpload.single('profilePhoto'), customerController.updateProfile);
router.post('/contact', upload.array('images', 5), customerController.sendContactMessage);
router.post('/wallet/recharge', customerController.rechargeWallet);
router.post('/premium/purchase', customerController.purchasePremium);

export default router;
