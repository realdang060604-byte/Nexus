import { NextFunction, Request, Response } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const requests = new Map<string, {
  count: number;
  resetAt: number;
}>();

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE) || 60;

export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
};

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.header('x-request-id')?.trim() || randomUUID();
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
};

export const rateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const now = Date.now();

  if (requests.size > 10_000) {
    for (const [requestKey, value] of requests) {
      if (value.resetAt <= now) {
        requests.delete(requestKey);
      }
    }
  }

  const key = req.ip || 'unknown';
  const current = requests.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + RATE_WINDOW_MS }
    : current;

  entry.count += 1;
  requests.set(key, entry);

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
  res.setHeader(
    'X-RateLimit-Remaining',
    Math.max(RATE_LIMIT - entry.count, 0)
  );

  if (entry.count > RATE_LIMIT) {
    res.setHeader(
      'Retry-After',
      Math.ceil((entry.resetAt - now) / 1000)
    );
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again shortly.',
      requestId: res.locals.requestId
    });
    return;
  }

  next();
};

export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const expected = process.env.NEXUS_API_KEY;

  if (!expected) {
    next();
    return;
  }

  const provided = req.header('x-api-key') || '';
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const valid = expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);

  if (!valid) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      requestId: res.locals.requestId
    });
    return;
  }

  next();
};
