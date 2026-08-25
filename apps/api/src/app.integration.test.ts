import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Server } from 'node:http';
import test, { after, before } from 'node:test';
import app from './app';

let server: Server;
let baseUrl = '';

before(async () => {
  process.env.NEXUS_API_KEY = 'integration-test-key';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('liveness is public and returns security headers', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { 'x-request-id': 'integration-request' }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'integration-request');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = await response.json() as { success: boolean; status: string };
  assert.equal(body.success, true);
  assert.equal(body.status, 'ONLINE');
});

test('readiness reports unavailable database', async () => {
  const response = await fetch(`${baseUrl}/health/ready`);
  assert.equal(response.status, 503);
  const body = await response.json() as {
    success: boolean;
    checks: { database: string };
  };
  assert.equal(body.success, false);
  assert.equal(body.checks.database, 'DOWN');
});

test('API routes reject a missing API key', async () => {
  const response = await fetch(`${baseUrl}/api/tasks`);
  assert.equal(response.status, 401);
  const body = await response.json() as { message: string; requestId: string };
  assert.equal(body.message, 'Unauthorized');
  assert.ok(body.requestId);
});

test('unknown public routes return a structured 404', async () => {
  const response = await fetch(`${baseUrl}/does-not-exist`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Route not found'
  });
});
