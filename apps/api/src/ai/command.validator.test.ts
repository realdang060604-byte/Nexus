import assert from 'node:assert/strict';
import test from 'node:test';

import { parseNexusCommand } from './command.validator';

test('accepts a valid command', () => {
  const command = parseNexusCommand({
    intent: 'RECORD_EXPENSE',
    confidence: 0.95,
    arguments: {
      amount: 35000,
      category: 'Ăn uống'
    }
  });

  assert.equal(command.intent, 'RECORD_EXPENSE');
  assert.equal(command.arguments.amount, 35000);
});

test('rejects an unknown intent', () => {
  assert.throws(
    () => parseNexusCommand({
      intent: 'DELETE_EVERYTHING',
      confidence: 1,
      arguments: {}
    }),
    /invalid intent/
  );
});

test('rejects invalid confidence and amount values', () => {
  assert.throws(
    () => parseNexusCommand({
      intent: 'RECORD_EXPENSE',
      confidence: 2,
      arguments: { amount: -1 }
    }),
    /invalid confidence/
  );

  assert.throws(
    () => parseNexusCommand({
      intent: 'RECORD_EXPENSE',
      confidence: 0.9,
      arguments: { amount: Number.NaN }
    }),
    /invalid amount/
  );
});

test('rejects unsupported arguments', () => {
  assert.throws(
    () => parseNexusCommand({
      intent: 'CREATE_TASK',
      confidence: 0.9,
      arguments: {
        title: 'Học TypeScript',
        destructive: true
      }
    }),
    /unsupported command arguments/
  );
});

test('accepts Calendar event arguments', () => {
  const command = parseNexusCommand({
    intent: 'CREATE_CALENDAR_EVENT',
    confidence: 0.98,
    arguments: {
      title: 'Họp với team',
      startAt: '2026-08-15T08:00:00+07:00',
      endAt: '2026-08-15T09:00:00+07:00',
      location: 'Văn phòng'
    }
  });

  assert.equal(command.intent, 'CREATE_CALENDAR_EVENT');
  assert.equal(
    command.arguments.startAt,
    '2026-08-15T08:00:00+07:00'
  );
});

test('accepts task lifecycle commands', () => {
  const complete = parseNexusCommand({
    intent: 'COMPLETE_TASK',
    confidence: 0.96,
    arguments: { title: 'học TypeScript' }
  });
  const cancel = parseNexusCommand({
    intent: 'CANCEL_TASK',
    confidence: 0.94,
    arguments: { title: 'họp team' }
  });

  assert.equal(complete.intent, 'COMPLETE_TASK');
  assert.equal(cancel.intent, 'CANCEL_TASK');
});

test('accepts monthly summary and transaction undo commands', () => {
  assert.equal(parseNexusCommand({
    intent: 'MONTHLY_FINANCE_SUMMARY',
    confidence: 0.97,
    arguments: {}
  }).intent, 'MONTHLY_FINANCE_SUMMARY');

  assert.equal(parseNexusCommand({
    intent: 'UNDO_LAST_TRANSACTION',
    confidence: 0.99,
    arguments: {}
  }).intent, 'UNDO_LAST_TRANSACTION');
});

test('accepts the daily briefing command', () => {
  assert.equal(parseNexusCommand({
    intent: 'DAILY_BRIEFING',
    confidence: 0.98,
    arguments: {}
  }).intent, 'DAILY_BRIEFING');
});
