import cors from 'cors';
import express from 'express';
import { createUserServices } from '../services/userServices.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requireUserId } from './middleware/requireUserId.js';
import callRoutes from './routes/callRoutes.js';

export function createApp({ corsOrigin = '*' } = {}) {
  const app = express();
  const getServiceForUser = createUserServices();

  const origin = corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim());

  app.disable('x-powered-by');
  app.use(cors({ origin }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/calls', requireUserId(getServiceForUser), callRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
