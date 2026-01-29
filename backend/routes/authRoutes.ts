import { Router } from 'express';
import { register, login, verify } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', auth, verify);

export default router;
