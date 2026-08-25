import { listCalendarEvents } from '../integrations/calendar/calendar.service';
import { getTodayExpense } from '../modules/finance/finance.service';
import { getTasks } from '../modules/tasks/task.service';
import { getVietnamDayRange } from '../utils/vietnam-time';
import { NexusTool } from './tool.types';
const CALENDAR_TIMEOUT_MS = 8_000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(
        () => reject(new Error('Google Calendar timed out')),
        timeoutMs
      );
    })
  ]);

export const dailyBriefingTool:
NexusTool<Record<string, never>> = {
  name: 'DAILY_BRIEFING',
  description: 'Summarize today across tasks, Calendar, and spending.',

  async execute(_input, context) {
    const { from, to } = getVietnamDayRange();
    const [tasks, expense, calendarResult] = await Promise.all([
      getTasks(context.userId),
      getTodayExpense(context.userId),
      withTimeout(
        listCalendarEvents({ from, to, limit: 20 }),
        CALENDAR_TIMEOUT_MS
      )
        .then(events => ({ events, error: null as string | null }))
        .catch(error => ({
          events: [],
          error: error instanceof Error
            ? error.message
            : 'Google Calendar unavailable'
        }))
    ]);

    const activeTasks = tasks.filter(task => (
      task.status === 'TODO' || task.status === 'IN_PROGRESS'
    ));
    const dueToday = activeTasks.filter(task => (
      task.dueAt && task.dueAt >= from && task.dueAt < to
    ));
    const overdue = activeTasks.filter(task => (
      task.dueAt && task.dueAt < from
    ));

    return {
      action: 'DAILY_BRIEFING',
      message: [
        `Hôm nay bạn có ${dueToday.length} công việc đến hạn`,
        `${calendarResult.events.length} sự kiện`,
        `và đã chi ${expense.total.toLocaleString('vi-VN')}đ.`
      ].join(', '),
      data: {
        date: from.toISOString(),
        tasks: {
          activeCount: activeTasks.length,
          dueToday,
          overdue
        },
        calendar: {
          events: calendarResult.events,
          error: calendarResult.error
        },
        finance: expense
      }
    };
  }
};
