import assert from 'node:assert/strict';
import test from 'node:test';

import { getVietnamDayRange } from './vietnam-time';

test('calculates Vietnam day boundaries independently of server timezone', () => {
  const { from, to } = getVietnamDayRange(
    new Date('2026-08-17T18:00:00.000Z')
  );

  assert.equal(from.toISOString(), '2026-08-17T17:00:00.000Z');
  assert.equal(to.toISOString(), '2026-08-18T17:00:00.000Z');
});
