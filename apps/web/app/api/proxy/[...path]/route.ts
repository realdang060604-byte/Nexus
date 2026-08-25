import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/server-session';

const ALLOWED_ROOTS = new Set([
  'tasks',
  'finance',
  'nexus',
  'calendar'
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const apiPath = path[0] === 'api'
    ? path.slice(1)
    : path;

  if (
    apiPath.length === 0 ||
    !ALLOWED_ROOTS.has(apiPath[0])
  ) {
    return NextResponse.json(
      { success: false, message: 'Proxy path is not allowed' },
      { status: 404 }
    );
  }

  const userId = readSession(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }
  const apiUrl = process.env.NEXUS_API_URL || 'http://localhost:5000';
  const target = new URL(`/api/${apiPath.join('/')}`, apiUrl);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set('x-user-id', userId);

  const apiKey = process.env.NEXUS_API_KEY;
  const contentType = request.headers.get('content-type');
  const requestId = request.headers.get('x-request-id');

  if (apiKey) headers.set('x-api-key', apiKey);
  if (contentType) headers.set('content-type', contentType);
  if (requestId) headers.set('x-request-id', requestId);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: 'no-store'
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ||
          'application/json',
        'x-request-id': upstream.headers.get('x-request-id') || ''
      }
    });

  } catch (error) {
    console.error('NEXUS API proxy error:', error);

    return NextResponse.json(
      { success: false, message: 'NEXUS API is unavailable' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
