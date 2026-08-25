import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'nexus_session';
const OWNER_ID = 'web-owner';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const secret = (): string => {
  const value = process.env.NEXUS_SESSION_SECRET || process.env.NEXUS_API_KEY;
  if (value) return value;
  if (process.env.NODE_ENV !== 'production') return 'nexus-local-development-secret';
  throw new Error('NEXUS_SESSION_SECRET is required');
};

const sign = (value: string): string => createHmac('sha256', secret())
  .update(value).digest('base64url');

export const readSession = (request: NextRequest): string | null => {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;
  const userId = value.slice(0, separator);
  const actual = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(sign(userId));
  return userId === OWNER_ID && actual.length === expected.length &&
    timingSafeEqual(actual, expected) ? userId : null;
};

export const setOwnerSession = (response: NextResponse): void => {
  response.cookies.set(SESSION_COOKIE, `${OWNER_ID}.${sign(OWNER_ID)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
};

export const passwordMatches = (candidate: string): boolean => {
  const configured = process.env.NEXUS_OWNER_PASSWORD;
  if (!configured) return process.env.NODE_ENV !== 'production' && candidate === 'nexus';
  const actual = Buffer.from(candidate);
  const expected = Buffer.from(configured);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
