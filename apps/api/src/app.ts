import express, {
  NextFunction,
  Request,
  Response
} from 'express';
import cors from 'cors';
import taskRoutes from './modules/tasks/task.routes';
import healthRoutes from './routes/health.routes';
import financeRoutes from './modules/finance/finance.routes';
import commandRoutes from './ai/command.routes';
import calendarRoutes from './integrations/calendar/calendar.routes';
import {
  rateLimit,
  requestContext,
  requireApiKey,
  securityHeaders
} from './middleware/security.middleware';

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestContext);
app.use(securityHeaders);

app.use(cors({
  origin: allowedOrigins?.length
    ? allowedOrigins
    : true
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '100kb'
}));
app.use('/api', rateLimit, requireApiKey);
app.use('/api/tasks', taskRoutes);
app.use('/health', healthRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/nexus', commandRoutes); 
app.use('/api/calendar', calendarRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled request error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: res.locals.requestId
  });
});

export default app;
