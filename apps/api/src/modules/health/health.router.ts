import { Router } from 'express';
import { getHealthStatus } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', getHealthStatus);
healthRouter.get('/health', getHealthStatus);
