import {
  NexusCommand,
  NexusIntent
} from './command.types';

const INTENTS: readonly NexusIntent[] = [
  'CREATE_TASK',
  'RECORD_EXPENSE',
  'RECORD_INCOME',
  'RECORD_SAVING',
  'LIST_TASKS',
  'COMPLETE_TASK',
  'CANCEL_TASK',
  'FINANCE_SUMMARY',
  'TODAY_EXPENSE',
  'RECENT_TRANSACTIONS',
  'MONTHLY_FINANCE_SUMMARY',
  'UNDO_LAST_TRANSACTION',
  'CREATE_CALENDAR_EVENT',
  'LIST_CALENDAR_EVENTS',
  'DAILY_BRIEFING',
  'UNKNOWN'
];

const PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH'
] as const;

const isRecord = (
  value: unknown
): value is Record<string, unknown> => (
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value)
);

export const parseNexusCommand = (
  value: unknown
): NexusCommand => {
  if (!isRecord(value)) {
    throw new Error('Gemini returned an invalid command');
  }

  const {
    intent,
    confidence,
    arguments: rawArguments
  } = value;

  if (
    typeof intent !== 'string' ||
    !INTENTS.includes(intent as NexusIntent)
  ) {
    throw new Error('Gemini returned an invalid intent');
  }

  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new Error('Gemini returned an invalid confidence');
  }

  if (!isRecord(rawArguments)) {
    throw new Error('Gemini returned invalid command arguments');
  }

  const allowedKeys = new Set([
    'title',
    'description',
    'dueAt',
    'priority',
    'amount',
    'category',
    'note',
    'startAt',
    'endAt',
    'location'
  ]);

  if (
    Object.keys(rawArguments).some(
      key => !allowedKeys.has(key)
    )
  ) {
    throw new Error('Gemini returned unsupported command arguments');
  }

  const stringKeys = [
    'title',
    'description',
    'dueAt',
    'category',
    'note',
    'startAt',
    'endAt',
    'location'
  ] as const;

  for (const key of stringKeys) {
    const field = rawArguments[key];

    if (
      field !== undefined &&
      typeof field !== 'string'
    ) {
      throw new Error(`Gemini returned invalid ${key}`);
    }
  }

  if (
    rawArguments.amount !== undefined &&
    (
      typeof rawArguments.amount !== 'number' ||
      !Number.isFinite(rawArguments.amount) ||
      rawArguments.amount <= 0
    )
  ) {
    throw new Error('Gemini returned an invalid amount');
  }

  if (
    rawArguments.priority !== undefined &&
    (
      typeof rawArguments.priority !== 'string' ||
      !PRIORITIES.includes(
        rawArguments.priority as typeof PRIORITIES[number]
      )
    )
  ) {
    throw new Error('Gemini returned an invalid priority');
  }

  return value as unknown as NexusCommand;
};
