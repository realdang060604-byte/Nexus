import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getConfirmationAction,
  requiresConfirmation
} from './confirmation';

test('recognizes Vietnamese confirmation messages', () => {
  assert.equal(getConfirmationAction('Xác nhận'), 'CONFIRM');
  assert.equal(getConfirmationAction('đồng ý'), 'CONFIRM');
  assert.equal(getConfirmationAction('OK!'), 'CONFIRM');
});

test('recognizes cancellation without matching normal sentences', () => {
  assert.equal(getConfirmationAction('Hủy bỏ'), 'CANCEL');
  assert.equal(getConfirmationAction('không'), 'CANCEL');
  assert.equal(getConfirmationAction('không tạo task này'), null);
});

test('requires confirmation only for mutating commands', () => {
  assert.equal(requiresConfirmation({
    intent: 'CREATE_CALENDAR_EVENT',
    confidence: 1,
    arguments: { title: 'Họp', startAt: '2026-08-18T08:00:00+07:00' }
  }), true);

  assert.equal(requiresConfirmation({
    intent: 'LIST_CALENDAR_EVENTS',
    confidence: 1,
    arguments: {}
  }), false);

  assert.equal(requiresConfirmation({
    intent: 'COMPLETE_TASK',
    confidence: 1,
    arguments: { title: 'học TypeScript' }
  }), true);

  assert.equal(requiresConfirmation({
    intent: 'RECORD_EXPENSE',
    confidence: 1,
    arguments: { amount: 85000, category: 'Ăn uống' }
  }), false);

  assert.equal(requiresConfirmation({
    intent: 'RECORD_INCOME',
    confidence: 1,
    arguments: { amount: 15000000, category: 'Lương' }
  }), false);

  assert.equal(requiresConfirmation({
    intent: 'RECORD_SAVING',
    confidence: 1,
    arguments: { amount: 2000000, category: 'Tiết kiệm' }
  }), false);

  assert.equal(requiresConfirmation({
    intent: 'UNDO_LAST_TRANSACTION',
    confidence: 1,
    arguments: {}
  }), true);
});
