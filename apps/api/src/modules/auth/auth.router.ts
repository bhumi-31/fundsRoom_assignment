import { Router } from 'express';
import { handleRegister, handleLogin, handleMe } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authenticateJWT } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), handleRegister);
authRouter.post('/login', validateRequest(loginSchema), handleLogin);
authRouter.get('/me', authenticateJWT, handleMe);
