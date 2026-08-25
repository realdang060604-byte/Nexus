import { listCalendarEvents } from '../integrations/calendar/calendar.service';
import { getTodayExpense } from '../modules/finance/finance.service';
import { getTasks } from '../modules/tasks/task.service';
import { getVietnamDayRange } from '../utils/vietnam-time';
import { NexusTool } from './tool.types';

export const dailyBriefingTool:
NexusTool<Record<string, never>> = {
  name: 'DAILY_BRIEFING',
  description: 'Summarize today across tasks, Calendar, and spending.',

  async execute(_input, context) {
    const { from, to } = getVietnamDayRange();
    const [tasks, expense, calendarResult] = await Promise.all([
      getTasks(context.userId),
      getTodayExpense(context.userId),
      listCalendarEvents({ from, to, limit: 20 })
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
