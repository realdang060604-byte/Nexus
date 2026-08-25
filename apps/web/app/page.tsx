'use client';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import NexusCommand
  from '@/components/NexusCommand';
import OwnerLogin from '@/components/OwnerLogin';
import PwaInstall from '@/components/PwaInstall';

import {
  deleteTask,
  deleteTransaction,
  CalendarEvent,
  FinanceSummary,
  getCalendarEvents,
  getFinanceSummary,
  getTasks,
  getTransactions,
  getSessionStatus,
  Task,
  TaskStatus,
  Transaction,
  updateTaskStatus
} from '@/lib/api';

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>([]);

  const [calendarLoading, setCalendarLoading] =
    useState(true);

  const [calendarError, setCalendarError] =
    useState('');

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [
    transactions,
    setTransactions
  ] = useState<Transaction[]>([]);

  const [finance, setFinance] =
    useState<FinanceSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState('');

  const [
    processingTask,
    setProcessingTask
  ] = useState<string | null>(null);

  const [
    processingTransaction,
    setProcessingTransaction
  ] = useState<string | null>(null);

  /* =========================
     LOAD DASHBOARD
  ========================= */

  const loadDashboard =
    useCallback(async () => {
      try {
        setDashboardError('');

        const [
          taskData,
          financeData,
          transactionData
        ] = await Promise.all([
          getTasks(),
          getFinanceSummary(),
          getTransactions()
        ]);

        const now = Date.now();
        setTasks(taskData.filter(task => {
          if (!task.dueAt) return true;
          return new Date(task.dueAt).getTime() >= now;
        }));

        setFinance(
          financeData
        );

        setTransactions(
          transactionData
        );
      } catch (error) {
        console.error(
          'Dashboard error:',
          error
        );

        setDashboardError(
          error instanceof Error
            ? error.message
            : 'Không thể tải dashboard.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const loadCalendar = useCallback(async () => {
    try {
      setCalendarLoading(true);
      setCalendarError('');
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const events = await getCalendarEvents({
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 50
      });
      const currentTime = Date.now();
      setCalendarEvents(events.filter(event => {
        const relevantTime = event.endAt || event.startAt;
        if (!relevantTime) return false;
        return new Date(relevantTime).getTime() >= currentTime;
      }));
    } catch (error) {
      console.error('Calendar dashboard error:', error);
      setCalendarError(
        error instanceof Error
          ? error.message
          : 'Không thể tải Google Calendar.'
      );
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    void getSessionStatus().then(setAuthenticated).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timeout = window.setTimeout(() => {
      void loadDashboard();
      void loadCalendar();
    }, 0);
    const refreshInterval = window.setInterval(() => {
      void loadDashboard();
      void loadCalendar();
    }, 60_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(refreshInterval);
    };
  }, [authenticated, loadCalendar, loadDashboard]);

  /* =========================
     TASK ACTIONS
  ========================= */

  const changeTaskStatus =
    async (
      id: string,
      status: TaskStatus
    ) => {
      try {
        setProcessingTask(id);

        await updateTaskStatus(
          id,
          status
        );

        await loadDashboard();
      } catch (error) {
        console.error(
          'Update task error:',
          error
        );
      } finally {
        setProcessingTask(null);
      }
    };

  const removeTask =
    async (
      id: string
    ) => {
      const confirmed =
        window.confirm(
          'Bạn có chắc muốn xóa công việc này?'
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingTask(id);

        await deleteTask(id);

        await loadDashboard();
      } catch (error) {
        console.error(
          'Delete task error:',
          error
        );
      } finally {
        setProcessingTask(null);
      }
    };

  /* =========================
     TRANSACTION ACTIONS
  ========================= */

  const removeTransaction =
    async (
      id: string
    ) => {
      const confirmed =
        window.confirm(
          'Bạn có chắc muốn xóa giao dịch này?'
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingTransaction(
          id
        );

        await deleteTransaction(
          id
        );

        await loadDashboard();
      } catch (error) {
        console.error(
          'Delete transaction error:',
          error
        );
      } finally {
        setProcessingTransaction(
          null
        );
      }
    };

  /* =========================
     HELPERS
  ========================= */

  const money = (
    value?: number
  ) =>
    Number(value || 0)
      .toLocaleString(
        'vi-VN'
      ) + ' đ';

  const activeTasks =
    tasks.filter(
      task =>
        task.status !==
          'DONE' &&
        task.status !==
          'CANCELLED'
    );

  /* =========================
     UI
  ========================= */

  if (authenticated === null) {
    return <main className="grid min-h-screen place-items-center text-zinc-400">Đang kiểm tra phiên...</main>;
  }
  if (!authenticated) return <OwnerLogin onSuccess={() => setAuthenticated(true)} />;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">

        {/* HEADER */}

        <header className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">

          <div className="flex items-center gap-4">

            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-sm font-black text-zinc-950">
              N
            </div>

            <div>

            <p className="text-[10px] font-medium tracking-[0.32em] text-zinc-500">
              PERSONAL AI OS
            </p>

            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              NEXUS
            </h1>

            </div>
          </div>

          <div className="flex items-center gap-2">
            <PwaInstall />
            <div className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium sm:flex ${
              dashboardError
                ? 'border-red-900 bg-red-950 text-red-400'
                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${dashboardError ? 'bg-red-400' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'}`} />
              {dashboardError ? 'OFFLINE' : 'SYSTEM ONLINE'}
            </div>
          </div>

        </header>

        <nav className="mb-4 grid grid-cols-4 gap-2" aria-label="Chức năng chính">
          {[
            ['#command', '⌘', 'Ra lệnh'],
            ['#tasks', '✓', 'Công việc'],
            ['#calendar', '□', 'Lịch'],
            ['#finance', '₫', 'Tài chính']
          ].map(([href, icon, label]) => (
            <a key={href} href={href} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950/70 px-2 py-3 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/40 hover:bg-emerald-950/20 hover:text-emerald-300 sm:text-sm">
              <span className="text-emerald-400">{icon}</span>{label}
            </a>
          ))}
        </nav>

        {/* AI COMMAND */}

        <div id="command">
          <NexusCommand
            onCompleted={async () => {
              await Promise.all([loadDashboard(), loadCalendar()]);
            }}
          />
        </div>

        <section className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/60 to-zinc-950 p-5">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400/70">Tổng tài sản hiện có</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {loading ? '—' : money(finance?.totalBalance)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Thu nhập trừ toàn bộ chi tiêu đã ghi nhận</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Có thể chi</p>
            <p className="mt-2 text-xl font-semibold text-blue-300">{loading ? '—' : money(finance?.spendingBalance)}</p>
            <p className="mt-2 text-xs text-zinc-600">Không gồm tiền tiết kiệm</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Đang tiết kiệm</p>
            <p className="mt-2 text-xl font-semibold text-violet-300">{loading ? '—' : money(finance?.totalSaving)}</p>
            <p className="mt-2 text-xs text-zinc-600">Vẫn thuộc tổng tài sản</p>
          </div>
        </section>

        {dashboardError && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
            <span>Không thể đồng bộ dữ liệu: {dashboardError}</span>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-lg border border-red-800 px-3 py-2 font-medium hover:bg-red-900/60"
            >
              Thử lại
            </button>
          </div>
        )}

        <section id="calendar" className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/65 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">CALENDAR</p>
              <h2 className="text-xl font-semibold">Lịch sắp tới</h2>
            </div>
            <button
              type="button"
              disabled={calendarLoading}
              onClick={() => void loadCalendar()}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
            >
              {calendarLoading ? 'Đang đồng bộ...' : 'Đồng bộ'}
            </button>
          </div>

          <MonthlyCalendar events={calendarEvents} tasks={activeTasks} loading={calendarLoading} />

          {calendarError ? (
            <div className="rounded-xl border border-amber-900/70 bg-amber-950/30 p-4 text-sm text-amber-200">
              <p>Chưa thể đọc Google Calendar: {calendarError}</p>
              <p className="mt-1 text-amber-400/80">
                Hãy kiểm tra OAuth hoặc chạy npm.cmd run calendar:test trong apps/api.
              </p>
            </div>
          ) : calendarLoading ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map(item => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl bg-zinc-800"
                />
              ))}
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-500">
              Không có sự kiện nào trong 7 ngày tới.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {calendarEvents.map((event, index) => (
                <CalendarEventItem
                  key={event.id || `${event.startAt}-${index}`}
                  event={event}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* =========================
              TASKS
          ========================= */}

          <section id="tasks" className="rounded-2xl border border-white/10 bg-zinc-950/65 p-4 backdrop-blur-xl sm:p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <p className="text-sm text-zinc-500">
                  TASKS
                </p>

                <h2 className="text-xl font-semibold">
                  Công việc
                </h2>

              </div>

              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                {
                  activeTasks.length
                } task
              </span>

            </div>

            {loading ? (

              <p className="text-zinc-500">
                Đang tải...
              </p>

            ) : activeTasks.length === 0 ? (

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">

                <p className="text-zinc-300">
                  ✓ Không còn công việc.
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Hãy ra lệnh cho NEXUS
                  tạo task mới.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {activeTasks
                  .slice(0, 10)
                  .map(task => (

                    <TaskItem
                      key={
                        task._id
                      }

                      task={
                        task
                      }

                      processing={
                        processingTask ===
                        task._id
                      }

                      onStatusChange={
                        changeTaskStatus
                      }

                      onDelete={
                        removeTask
                      }
                    />

                  ))}

              </div>

            )}

          </section>

          {/* =========================
              FINANCE
          ========================= */}

          <section id="finance" className="rounded-2xl border border-white/10 bg-zinc-950/65 p-4 backdrop-blur-xl sm:p-5">

            <div className="mb-5">

              <p className="text-sm text-zinc-500">
                FINANCE
              </p>

              <h2 className="text-xl font-semibold">
                Tài chính
              </h2>

            </div>

            {!finance ? (

              <p className="text-zinc-500">
                Đang tải...
              </p>

            ) : (

              <>

                <div className="grid grid-cols-2 gap-4">

                  <FinanceCard
                    title="Tổng số dư"
                    value={money(
                      finance.totalBalance
                    )}
                  />

                  <FinanceCard
                    title="Có thể chi tiêu"
                    value={money(
                      finance.spendingBalance
                    )}
                  />

                  <FinanceCard
                    title="Thu nhập"
                    value={money(
                      finance.totalIncome
                    )}
                  />

                  <FinanceCard
                    title="Chi tiêu"
                    value={money(
                      finance.totalExpense
                    )}
                  />

                  <FinanceCard
                    title="Tiết kiệm"
                    value={money(
                      finance.totalSaving
                    )}
                  />

                </div>

                {/* TRANSACTIONS */}

                <div className="mt-7">

                  <div className="mb-3 flex items-center justify-between">

                    <h3 className="font-medium">
                      Giao dịch gần đây
                    </h3>

                    <span className="text-xs text-zinc-500">

                      {
                        transactions.length
                      } giao dịch

                    </span>

                  </div>

                  {
                    transactions.length ===
                    0 ? (

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-500">

                        Chưa có giao dịch.

                      </div>

                    ) : (

                      <div className="space-y-2">

                        {transactions
                          .slice(
                            0,
                            8
                          )
                          .map(
                            transaction => (

                              <TransactionItem
                                key={
                                  transaction._id
                                }

                                transaction={
                                  transaction
                                }

                                processing={
                                  processingTransaction ===
                                  transaction._id
                                }

                                onDelete={
                                  removeTransaction
                                }
                              />

                            )
                          )}

                      </div>

                    )
                  }

                </div>

              </>

            )}

          </section>

        </div>

      </div>

    </main>
  );
}

const localDateKey = (date: Date): string => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');

function MonthlyCalendar({
  events,
  tasks,
  loading
}: {
  events: CalendarEvent[];
  tasks: Task[];
  loading: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const initialTimer = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  if (!now) {
    return <div className="h-72 animate-pulse rounded-xl bg-zinc-900" />;
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const eventMap = new Map<string, CalendarEvent[]>();
  const importantTaskMap = new Map<string, Task[]>();

  for (const event of events) {
    if (!event.startAt) continue;
    const key = event.startAt.length === 10
      ? event.startAt
      : localDateKey(new Date(event.startAt));
    eventMap.set(key, [...(eventMap.get(key) || []), event]);
  }
  for (const task of tasks) {
    if (!task.dueAt || task.priority !== 'HIGH') continue;
    const key = localDateKey(new Date(task.dueAt));
    importantTaskMap.set(key, [...(importantTaskMap.get(key) || []), task]);
  }

  const todayKey = localDateKey(now);
  const monthLabel = now.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="rounded-xl border border-white/8 bg-black/25 p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium capitalize text-zinc-100">{monthLabel}</p>
          <p className="mt-1 font-mono text-xs text-emerald-400">
            {now.toLocaleTimeString('vi-VN')} · thời gian thực
          </p>
        </div>
        <div className="flex gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-400" />Sự kiện</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-400" />Quan trọng</span>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase text-zinc-600 sm:text-xs">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="h-12 sm:h-16" />;
          const key = localDateKey(new Date(year, month, day));
          const dayEvents = eventMap.get(key) || [];
          const importantTasks = importantTaskMap.get(key) || [];
          const important = importantTasks.length > 0;
          const title = [
            ...importantTasks.map(task => `Quan trọng: ${task.title}`),
            ...dayEvents.map(event => `Lịch: ${event.title}`)
          ].join('\n');

          return (
            <div
              key={key}
              title={title || undefined}
              className={`relative flex h-12 flex-col items-center justify-center rounded-lg border text-sm transition sm:h-16 ${
                important
                  ? 'border-orange-400/50 bg-orange-400/15 text-orange-100 shadow-[0_0_18px_rgba(251,146,60,0.12)]'
                  : key === todayKey
                    ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
                    : 'border-transparent bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/70'
              }`}
            >
              <span className={important ? 'font-semibold' : ''}>{day}</span>
              <span className="mt-1 flex h-2 items-center gap-1">
                {dayEvents.length > 0 && <i className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                {important && <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />}
              </span>
            </div>
          );
        })}
      </div>
      {loading && <p className="mt-3 text-center text-xs text-zinc-600">Đang đồng bộ lịch...</p>}
    </div>
  );
}

function CalendarEventItem({
  event
}: {
  event: CalendarEvent;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
        {event.startAt
          ? new Date(event.startAt).toLocaleString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              hour: event.startAt.includes('T') ? '2-digit' : undefined,
              minute: event.startAt.includes('T') ? '2-digit' : undefined
            })
          : 'Chưa có thời gian'}
      </p>
      <h3 className="mt-2 line-clamp-2 font-medium text-zinc-100">
        {event.title}
      </h3>
      {event.location && (
        <p className="mt-2 truncate text-xs text-zinc-500">
          📍 {event.location}
        </p>
      )}
    </>
  );

  const className =
    'group block min-h-32 rounded-2xl border border-white/8 bg-black/30 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-blue-950/10';

  return event.htmlLink ? (
    <a
      href={event.htmlLink}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

/* ==========================================
   TASK ITEM
========================================== */

function TaskItem({
  task,
  processing,
  onStatusChange,
  onDelete
}: {
  task: Task;

  processing: boolean;

  onStatusChange: (
    id: string,
    status: TaskStatus
  ) => Promise<void>;

  onDelete: (
    id: string
  ) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/30 p-4 transition duration-300 hover:border-emerald-400/20 hover:bg-emerald-950/5">

      <div className="flex items-start gap-3">

        {/* COMPLETE */}

        <button
          disabled={processing}
          onClick={() =>
            onStatusChange(
              task._id,
              'DONE'
            )
          }
          title="Hoàn thành"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-zinc-500 transition hover:border-green-500 hover:bg-green-950 hover:text-green-400 disabled:opacity-50"
        >
          ✓
        </button>

        {/* INFO */}

        <div className="min-w-0 flex-1">

          <p className="font-medium">
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 text-sm text-zinc-500">
              {
                task.description
              }
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">

            {/* STATUS */}

            <select
              value={
                task.status
              }

              disabled={
                processing
              }

              onChange={event =>
                onStatusChange(
                  task._id,
                  event.target
                    .value as TaskStatus
                )
              }

              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none"
            >
              <option value="TODO">
                TODO
              </option>

              <option value="IN_PROGRESS">
                IN PROGRESS
              </option>

              <option value="DONE">
                DONE
              </option>
            </select>

            <PriorityBadge
              priority={
                task.priority
              }
            />

            <span className="text-xs text-zinc-600">
              {
                task.source
              }
            </span>

            {task.dueAt && (
              <span className="text-xs text-zinc-500">
                Hạn {new Date(task.dueAt).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}

          </div>

        </div>

        {/* DELETE */}

        <button
          onClick={() =>
            onDelete(
              task._id
            )
          }

          disabled={
            processing
          }

          title="Xóa công việc"
          aria-label="Xóa công việc"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 text-red-400 transition active:scale-95 hover:border-red-700 hover:bg-red-950 disabled:opacity-50"
        >
          ✕
        </button>

      </div>

    </div>
  );
}

/* ==========================================
   FINANCE CARD
========================================== */

function FinanceCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/30 p-4">

      <p className="text-xs text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>

    </div>
  );
}

/* ==========================================
   PRIORITY
========================================== */

function PriorityBadge({
  priority
}: {
  priority:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';
}) {
  let className =
    'bg-zinc-800 text-zinc-400';

  if (
    priority === 'HIGH'
  ) {
    className =
      'bg-red-950 text-red-400';
  }

  if (
    priority === 'MEDIUM'
  ) {
    className =
      'bg-yellow-950 text-yellow-400';
  }

  if (
    priority === 'LOW'
  ) {
    className =
      'bg-green-950 text-green-400';
  }

  return (
    <span
      className={
        `rounded-lg px-2 py-1 text-xs ${className}`
      }
    >
      {priority}
    </span>
  );
}

/* ==========================================
   TRANSACTION ITEM
========================================== */

function TransactionItem({
  transaction,
  processing,
  onDelete
}: {
  transaction: Transaction;

  processing: boolean;

  onDelete: (
    id: string
  ) => Promise<void>;
}) {
  const isIncome =
    transaction.type ===
    'INCOME';

  const isSaving =
    transaction.type ===
    'SAVING';

  const amountClass =
    isIncome
      ? 'text-green-400'
      : isSaving
        ? 'text-blue-400'
        : 'text-red-400';

  const prefix =
    isIncome
      ? '+'
      : isSaving
        ? '→'
        : '-';

  const amount =
    transaction.amount
      .toLocaleString(
        'vi-VN'
      ) + ' đ';

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-black/30 p-4 transition duration-300 hover:border-white/15 hover:bg-white/[0.03]">

      {/* INFO */}

      <div className="min-w-0 flex-1">

        <p className="truncate font-medium">
          {
            transaction.note ||
            transaction.category
          }
        </p>

        <p className="mt-1 text-xs text-zinc-500">

          {
            transaction.category
          }

          {' • '}

          {
            transaction.source
          }

        </p>

      </div>

      {/* AMOUNT */}

      <div className="shrink-0 text-right">

        <p
          className={
            `font-semibold ${amountClass}`
          }
        >
          {prefix}
          {amount}
        </p>

        <p className="mt-1 text-xs text-zinc-600">

          {new Date(
            transaction.occurredAt
          ).toLocaleDateString(
            'vi-VN'
          )}

        </p>

      </div>

      {/* DELETE */}

      <button
        onClick={() =>
          onDelete(
            transaction._id
          )
        }

        disabled={
          processing
        }

        title="Xóa giao dịch"
        aria-label="Xóa giao dịch"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 text-red-400 transition active:scale-95 hover:border-red-700 hover:bg-red-950 disabled:opacity-50"
      >
        ✕
      </button>

    </div>
  );
}
