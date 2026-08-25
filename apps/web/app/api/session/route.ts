import { NextRequest, NextResponse } from 'next/server';
import {
  passwordMatches,
  readSession,
  SESSION_COOKIE,
  setOwnerSession
} from '@/lib/server-session';

export const GET = (request: NextRequest) => NextResponse.json({
  authenticated: Boolean(readSession(request))
});

export const POST = async (request: NextRequest) => {
  const body = await request.json().catch(() => ({})) as { password?: unknown };
  if (typeof body.password !== 'string' || !passwordMatches(body.password)) {
    return NextResponse.json({ message: 'Mật khẩu không đúng' }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  setOwnerSession(response);
  return response;
};

export const DELETE = () => {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
};
