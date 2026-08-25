import {
  Markup,
  Telegraf
} from 'telegraf';

import {
  processNexusMessage
} from '../core/nexus.core';

import {
  clearConversation,
  getRecentConversation
} from '../modules/conversations/conversation.service';

import { startTaskReminderScheduler } from './task-reminder.scheduler';

let bot:
  Telegraf | null =
  null;

let stopTaskReminderScheduler:
  (() => void) | null =
  null;

const confirmationKeyboard = () => Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Xác nhận', 'nexus_confirm'),
    Markup.button.callback('✖️ Hủy', 'nexus_cancel')
  ]
]);

/* ==========================================
   START TELEGRAM BOT
========================================== */

export const startTelegramBot =
  async (): Promise<void> => {

    const token =
      process.env.TELEGRAM_BOT_TOKEN;

    console.log(
      '🔍 Checking Telegram configuration...'
    );

    if (!token) {
      console.log(
        '⚠️ TELEGRAM_BOT_TOKEN not found in .env'
      );

      return;
    }

    console.log(
      '✅ Telegram token found'
    );

    bot =
      new Telegraf(
        token
      );

    const allowedUsers = new Set(
      (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
        .split(',').map(value => value.trim()).filter(Boolean)
    );

    bot.use(async (ctx, next) => {
      const userId = ctx.from ? String(ctx.from.id) : '';
      if (allowedUsers.size > 0 && allowedUsers.has(userId)) {
        return next();
      }
      if (allowedUsers.size === 0 && process.env.NODE_ENV !== 'production') {
        return next();
      }
      console.warn('Blocked unauthorized Telegram update', { userId });
    });

    /* ======================================
       /START
    ====================================== */

    bot.start(
      async ctx => {

        await ctx.reply(
          [
            '🤖 NEXUS ONLINE',
            '',
            'Tôi là trợ lý AI cá nhân của bạn.',
            '',
            'Bạn có thể nói chuyện trực tiếp với tôi.',
            '',
            '💰 Ví dụ Finance:',
            '• Ăn trưa 85k',
            '• Nhận lương 15 triệu',
            '• Chuyển 2 triệu sang tiết kiệm',
            '• Hôm nay tôi đã tiêu bao nhiêu?',
            '',
            '✅ Ví dụ Tasks:',
            '• Tạo công việc học TypeScript',
            '• Tôi còn những công việc nào?',
            '',
            '📅 Ví dụ Calendar:',
            '• Tạo lịch họp team lúc 8 giờ sáng mai',
            '• Hôm nay tôi có lịch gì?',
            '• Tổng quan hôm nay của tôi',
            '',
            '🧠 Memory:',
            '• /history - xem lịch sử gần đây',
            '• /clear - xóa lịch sử hội thoại',
            '',
            'ℹ️ /help - xem hướng dẫn'
          ].join('\n')
        );

      }
    );

    /* ======================================
       /HELP
    ====================================== */

    bot.command(
      'help',
      async ctx => {

        await ctx.reply(
          [
            '🧠 NEXUS HELP',
            '',
            '━━━━━━━━━━━━━━━━',
            '💰 FINANCE',
            '━━━━━━━━━━━━━━━━',
            '',
            '• Ăn sáng 35k',
            '• Ăn trưa 85k',
            '• Đổ xăng 200k',
            '• Nhận thưởng 500k',
            '• Nhận lương 15 triệu',
            '• Chuyển 1tr sang tiết kiệm',
            '',
            'Bạn cũng có thể hỏi:',
            '',
            '• Hôm nay tôi đã tiêu bao nhiêu?',
            '• Tình hình tài chính của tôi?',
            '• Cho tôi xem giao dịch gần đây',
            '• Tổng kết tài chính tháng này',
            '• Hoàn tác giao dịch vừa rồi',
            '',
            '━━━━━━━━━━━━━━━━',
            '✅ TASKS',
            '━━━━━━━━━━━━━━━━',
            '',
            '• Tạo công việc làm báo cáo',
            '• Tạo task học TypeScript',
            '• Tôi còn việc gì?',
            '• Tôi đã làm xong task học TypeScript',
            '• Hủy task họp team',
            '',
            '━━━━━━━━━━━━━━━━',
            '📅 CALENDAR',
            '━━━━━━━━━━━━━━━━',
            '',
            '• Tạo lịch họp lúc 8 giờ sáng mai',
            '• Tạo lịch học từ 19 giờ đến 21 giờ',
            '• Lịch tuần này của tôi',
            '• Tổng quan hôm nay của tôi',
            '',
            'Các thao tác tạo mới sẽ hiển thị nút Xác nhận/Hủy.',
            '',
            '━━━━━━━━━━━━━━━━',
            '🧠 MEMORY',
            '━━━━━━━━━━━━━━━━',
            '',
            '/history',
            'Xem các tin nhắn gần đây.',
            '',
            '/clear',
            'Xóa lịch sử hội thoại Telegram.',
            '',
            '⚠️ /clear không xóa task hoặc dữ liệu tài chính.'
          ].join('\n')
        );

      }
    );

    /* ======================================
       /HISTORY
    ====================================== */

    bot.command(
      'history',
      async ctx => {

        const userId =
          String(
            ctx.from.id
          );

        try {

          const history =
            await getRecentConversation(
              userId,
              'TELEGRAM',
              10
            );

          if (
            history.length === 0
          ) {
            await ctx.reply(
              '🧠 Tôi chưa có lịch sử hội thoại nào của bạn.'
            );

            return;
          }

          const formattedHistory =
            history
              .map(
                (
                  item,
                  index
                ) => {

                  const role =
                    item.role ===
                    'USER'
                      ? '👤 Bạn'
                      : '🤖 NEXUS';

                  return [
                    `${index + 1}. ${role}`,
                    item.message
                  ].join('\n');

                }
              )
              .join(
                '\n\n'
              );

          const reply =
            [
              '🧠 LỊCH SỬ GẦN ĐÂY',
              '',
              formattedHistory
            ].join('\n');

          await ctx.reply(
            reply
          );

        } catch (error) {

          console.error(
            '❌ History error:',
            error
          );

          await ctx.reply(
            '⚠️ Không thể đọc lịch sử hội thoại.'
          );

        }

      }
    );

    /* ======================================
       /CLEAR
    ====================================== */

    bot.command(
      'clear',
      async ctx => {

        const userId =
          String(
            ctx.from.id
          );

        try {

          const result =
            await clearConversation(
              userId,
              'TELEGRAM'
            );

          console.log(
            '🧹 TELEGRAM MEMORY CLEARED:',
            {
              userId,
              deleted:
                result.deletedCount
            }
          );

          await ctx.reply(
            [
              '🧹 Đã xóa lịch sử hội thoại Telegram.',
              '',
              `Đã xóa ${result.deletedCount ?? 0} tin nhắn khỏi memory.`,
              '',
              '✅ Task và dữ liệu tài chính vẫn được giữ nguyên.'
            ].join('\n')
          );

        } catch (error) {

          console.error(
            '❌ Clear memory error:',
            error
          );

          await ctx.reply(
            '⚠️ Không thể xóa lịch sử hội thoại.'
          );

        }

      }
    );

    /* ======================================
       INLINE CONFIRMATION
    ====================================== */

    bot.action(
      ['nexus_confirm', 'nexus_cancel'],
      async ctx => {
        const callbackData = 'data' in ctx.callbackQuery
          ? ctx.callbackQuery.data
          : '';
        const isConfirm = callbackData === 'nexus_confirm';
        const message = isConfirm ? 'xác nhận' : 'hủy';
        const userId = String(ctx.from.id);

        try {
          await ctx.answerCbQuery(
            isConfirm ? 'Đang thực hiện...' : 'Đang hủy...'
          );

          const result = await processNexusMessage({
            userId,
            channel: 'TELEGRAM',
            message
          });

          try {
            await ctx.editMessageReplyMarkup(undefined);
          } catch {
            // The original message may already have been edited or removed.
          }

          await ctx.reply(result.reply);
        } catch (error) {
          console.error('❌ Telegram confirmation error:', error);
          await ctx.reply('⚠️ NEXUS không thể xử lý yêu cầu này.');
        }
      }
    );

    /* ======================================
       NORMAL TEXT MESSAGE
    ====================================== */

    bot.on(
      'text',
      async ctx => {

        const message =
          ctx.message.text.trim();

        if (!message) {
          return;
        }

        const userId =
          String(
            ctx.from.id
          );

        try {

          console.log(
            '📨 TELEGRAM MESSAGE:',
            message
          );

          await ctx.sendChatAction(
            'typing'
          );

          /* ================================
             NEXUS CORE
          ================================ */

          const result =
            await processNexusMessage({
              userId,

              channel:
                'TELEGRAM',

              message
            });

          console.log(
            '🧠 TELEGRAM RESULT:',
            {
              intent:
                result.command.intent,

              success:
                result.success,

              action:
                result.execution?.action
            }
          );

          if (result.requiresConfirmation) {
            await ctx.reply(
              result.reply,
              confirmationKeyboard()
            );
          } else {
            await ctx.reply(result.reply);
          }

        } catch (error) {

          console.error(
            '❌ Telegram processing error:',
            error
          );

          await ctx.reply(
            '⚠️ NEXUS gặp lỗi khi xử lý yêu cầu.'
          );

        }

      }
    );

    /* ======================================
       GLOBAL BOT ERROR
    ====================================== */

    bot.catch(
      error => {

        console.error(
          '❌ Telegram bot runtime error:',
          error
        );

      }
    );

    /* ======================================
       CONNECT TELEGRAM
    ====================================== */

    console.log(
      '🚀 Connecting to Telegram...'
    );

    bot.launch(
      {
        dropPendingUpdates:
          false
      },

      () => {

        console.log(
          '📱 Telegram bot connected successfully'
        );

        if (bot && !stopTaskReminderScheduler) {
          stopTaskReminderScheduler =
            startTaskReminderScheduler(bot);
        }

      }
    );

  };

/* ==========================================
   STOP TELEGRAM BOT
========================================== */

export const stopTelegramBot =
  (): void => {

    if (!bot) {
      return;
    }

    console.log(
      '🛑 Stopping Telegram bot...'
    );

    stopTaskReminderScheduler?.();
    stopTaskReminderScheduler = null;

    bot.stop();

    bot = null;

  };
