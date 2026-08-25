export type NexusIntent =
  | 'CREATE_TASK'
  | 'RECORD_EXPENSE'
  | 'RECORD_INCOME'
  | 'RECORD_SAVING'
  | 'LIST_TASKS'
  | 'COMPLETE_TASK'
  | 'CANCEL_TASK'
  | 'FINANCE_SUMMARY'
  | 'TODAY_EXPENSE'
  | 'RECENT_TRANSACTIONS'
  | 'MONTHLY_FINANCE_SUMMARY'
  | 'UNDO_LAST_TRANSACTION'
  | 'CREATE_CALENDAR_EVENT'
  | 'LIST_CALENDAR_EVENTS'
  | 'DAILY_BRIEFING'
  | 'UNKNOWN';

export interface NexusCommand {
  intent: NexusIntent;

  confidence: number;

  arguments: {
    title?: string;
    description?: string;

    dueAt?: string;

    priority?:
      | 'LOW'
      | 'MEDIUM'
      | 'HIGH';

    amount?: number;

    category?: string;

    note?: string;

    startAt?: string;
    endAt?: string;
    location?: string;
  };
}
