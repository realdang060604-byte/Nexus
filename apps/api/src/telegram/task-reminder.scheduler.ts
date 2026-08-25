import { Telegraf } from 'telegraf';

import {
  claimNextTelegramReminder,
  markTaskReminderSent,
  releaseTaskReminder
} from '../modules/tasks/task.service';

const MINUTE_MS = 60_000;
const MAX_REMINDERS_PER_RUN = 25;

const positiveNumber = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatReminder = (
  title: string,
  dueAt: Date,
  priority: string
): string => [
  '⏰ NEXUS REMINDER',
  '',
  `📌 ${title}`,
  `🕒 Hạn: ${dueAt.toLocaleString('vi-VN', {
    timeZone: process.env.NEXUS_TIME_ZONE || 'Asia/Ho_Chi_Minh'
  })}`,
  `⚡ Ưu tiên: ${priority}`
].join('\n');

export const startTaskReminderScheduler = (
  telegramBot: Telegraf
): (() => void) => {
  const minutesBefore = positiveNumber(
    process.env.TASK_REMINDER_MINUTES_BEFORE,
    15
  );
  const intervalSeconds = positiveNumber(
    process.env.TASK_REMINDER_INTERVAL_SECONDS,
    60
  );
  const lookbackMinutes = positiveNumber(
    process.env.TASK_REMINDER_LOOKBACK_MINUTES,
    1440
  );
  let running = false;

  const run = async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;

    try {
      const now = new Date();
      const from = new Date(now.getTime() - lookbackMinutes * MINUTE_MS);
      const to = new Date(now.getTime() + minutesBefore * MINUTE_MS);

      for (let index = 0; index < MAX_REMINDERS_PER_RUN; index += 1) {
        const claimedAt = new Date();
        const task = await claimNextTelegramReminder(
          from,
          to,
          claimedAt,
          new Date(claimedAt.getTime() - 10 * MINUTE_MS)
        );

        if (!task) {
          break;
        }

        try {
          await telegramBot.telegram.sendMessage(
            task.userId,
            formatReminder(
              task.title,
              task.dueAt as Date,
              task.priority
            )
          );
          await markTaskReminderSent(String(task._id), claimedAt, new Date());
        } catch (error) {
          await releaseTaskReminder(String(task._id), claimedAt);
          console.error('❌ Telegram task reminder failed:', {
            taskId: task._id,
            userId: task.userId,
            error
          });
        }
      }
    } catch (error) {
      console.error('❌ Task reminder scheduler error:', error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(
    () => void run(),
    intervalSeconds * 1000
  );

  void run();
  console.log(
    `⏰ Task reminders enabled (${minutesBefore} minutes before due time)`
  );

  return () => clearInterval(timer);
};
