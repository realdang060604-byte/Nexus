import 'dotenv/config';

import mongoose from 'mongoose';
import { Server } from 'node:http';

import app from './app';
import { connectDatabase } from './config/database';
import {
  startTelegramBot,
  stopTelegramBot
} from './telegram/telegram.bot';

const PORT = Number(process.env.PORT) || 5000;

let httpServer: Server | null = null;
let isShuttingDown = false;

const validateProductionConfig = (): void => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!process.env.NEXUS_API_KEY) {
    throw new Error('NEXUS_API_KEY is required in production');
  }

  if (!process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS is required in production');
  }

  if (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_ALLOWED_USER_IDS) {
    throw new Error('TELEGRAM_ALLOWED_USER_IDS is required when Telegram is enabled');
  }
};

const startServer = async (): Promise<void> => {
  try {
    console.log('Starting NEXUS...');
    validateProductionConfig();
    await connectDatabase();

    httpServer = app.listen(PORT, () => {
      console.log('');
      console.log('======================================');
      console.log('NEXUS API');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log('======================================');
    });

    await startTelegramBot();
  } catch (error) {
    console.error('Failed to start NEXUS:', error);
    process.exitCode = 1;
  }
};

const shutdown = async (
  signal: NodeJS.Signals
): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\nStopping NEXUS (${signal})...`);
  stopTelegramBot();

  try {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer?.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await mongoose.disconnect();
    process.exitCode = 0;
  } catch (error) {
    console.error('Failed to stop NEXUS cleanly:', error);
    process.exitCode = 1;
  }
};

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startServer();
