const API_URL = '/api/proxy';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  source: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  totalBalance: number;
  spendingBalance: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'SAVING';

export interface Transaction {
  _id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  source: string;
  occurredAt: string;
}

export interface NexusCommandResponse {
  success: boolean;
  requiresConfirmation?: boolean;
  message?: string;
  result?: {
    action: string;
    data?: unknown;
    message: string;
  };
}

export interface CalendarEvent {
  id?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  htmlLink?: string | null;
  status?: string | null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let json: unknown;

  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message = json &&
      typeof json === 'object' &&
      'message' in json &&
      typeof json.message === 'string'
      ? json.message
      : `Request failed: ${response.status}`;

    throw new Error(message);
  }

  return json as T;
}

function requestHeaders(json = false): HeadersInit {
  return json ? { 'Content-Type': 'application/json' } : {};
}

export async function getSessionStatus(): Promise<boolean> {
  const response = await fetch('/api/session', { cache: 'no-store' });
  const json = await parseResponse<{ authenticated: boolean }>(response);
  return json.authenticated;
}

export async function login(password: string): Promise<void> {
  const response = await fetch('/api/session', {
    method: 'POST', headers: requestHeaders(true), body: JSON.stringify({ password })
  });
  await parseResponse(response);
}

export async function getTasks(): Promise<Task[]> {
  const response = await fetch(`${API_URL}/api/tasks`, {
    cache: 'no-store',
    headers: requestHeaders()
  });
  const json = await parseResponse<{ data?: Task[] }>(response);
  return json.data || [];
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
) {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: requestHeaders(true),
    body: JSON.stringify({ status })
  });
  return parseResponse(response);
}

export async function deleteTask(id: string) {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'DELETE',
    headers: requestHeaders()
  });
  return parseResponse(response);
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const response = await fetch(`${API_URL}/api/finance/summary`, {
    cache: 'no-store',
    headers: requestHeaders()
  });
  const json = await parseResponse<{ data: FinanceSummary }>(response);
  return json.data;
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/api/finance/transactions`, {
    cache: 'no-store',
    headers: requestHeaders()
  });
  const json = await parseResponse<{ data?: Transaction[] }>(response);
  return json.data || [];
}

export async function deleteTransaction(id: string) {
  const response = await fetch(
    `${API_URL}/api/finance/transactions/${id}`,
    {
      method: 'DELETE',
      headers: requestHeaders()
    }
  );
  return parseResponse(response);
}

export async function sendNexusCommand(
  message: string
): Promise<NexusCommandResponse> {
  const response = await fetch(`${API_URL}/api/nexus/command`, {
    method: 'POST',
    headers: requestHeaders(true),
    body: JSON.stringify({ message })
  });
  return parseResponse<NexusCommandResponse>(response);
}

export async function getCalendarEvents(options?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    limit: String(options?.limit || 50)
  });
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  const response = await fetch(
    `${API_URL}/api/calendar/events?${params.toString()}`,
    {
      cache: 'no-store',
      headers: requestHeaders()
    }
  );
  const json = await parseResponse<{ data?: CalendarEvent[] }>(response);
  return json.data || [];
}
