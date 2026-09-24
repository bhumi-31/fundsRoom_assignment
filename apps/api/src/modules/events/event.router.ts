import { Router } from 'express';
import { handleSSEStream } from './event.controller.js';

export const eventRouter = Router();

eventRouter.get('/events', handleSSEStream);
