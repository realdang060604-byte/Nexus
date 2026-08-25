import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'NEXUS API',
    status: 'ONLINE',
    version: '0.0.1',
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    service: 'NEXUS API',
    status: databaseReady ? 'READY' : 'NOT_READY',
    checks: {
      database: databaseReady ? 'UP' : 'DOWN'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
