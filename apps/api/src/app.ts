import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { workOrderRouter } from './modules/work-orders/work-order.router.js';
import { transferRouter } from './modules/transfers/transfer.router.js';
import { customerOrderRouter } from './modules/customer-orders/customer-order.router.js';
import { eventRouter } from './modules/events/event.router.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// Health check endpoints
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

// API v1 Modules
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/work-orders', workOrderRouter);
app.use('/api/v1/transfers', transferRouter);
app.use('/api/v1/orders', customerOrderRouter);
app.use('/api/v1', eventRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

// Centralized Error Handler
app.use(errorHandler);
