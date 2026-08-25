import assert from 'node:assert/strict';
import test from 'node:test';
import { Request } from 'express';

import { getRequestUserId } from './request-user';

const requestWithUserId = (
  userId?: string
): Request => ({
  header: (name: string) => (
    name === 'x-user-id' ? userId : undefined
  )
}) as unknown as Request;

test('uses a trimmed x-user-id header', () => {
  assert.equal(
    getRequestUserId(requestWithUserId(' telegram-123 ')),
    'telegram-123'
  );
});

test('falls back to the local web user', () => {
  assert.equal(
    getRequestUserId(requestWithUserId()),
    'web-local-user'
  );
});
