import { Router } from 'express';
import { register, login, logout, getMe, getAllMembers, updateProfile } from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Rotas de autenticação protegidas por rate limiting estrito
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Rotas de perfil e membros
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.get('/members', getAllMembers);

export default router;
