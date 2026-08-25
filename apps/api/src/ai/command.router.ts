import { getAi } from './ai.client';
import { NexusCommand } from './command.types';
import { parseNexusCommand } from './command.validator';

const MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash-lite';
const routeKnownCommand = (message: string): NexusCommand | null => {
  const normalized = message
    .trim()
    .toLocaleLowerCase('vi-VN')
    .replace(/\s+/g, ' ');

  if ([
    'tổng quan hôm nay',
    'tổng quan hôm nay của tôi',
    'cho tôi tổng quan hôm nay',
    'bản tin hôm nay',
    'tóm tắt ngày hôm nay'
  ].includes(normalized)) {
    return {
      intent: 'DAILY_BRIEFING',
      confidence: 1,
      arguments: {}
    };
  }

  return null;
};

export const routeCommand = async (
  message: string
): Promise<NexusCommand> => {
  const knownCommand = routeKnownCommand(message);
  if (knownCommand) return knownCommand;

  const prompt = `
You are the command router for NEXUS, a personal AI operating system.

Your ONLY job is to identify the user's intent and extract structured arguments.

You must return JSON only.

Available intents:

CREATE_TASK
RECORD_EXPENSE
RECORD_INCOME
RECORD_SAVING
LIST_TASKS
COMPLETE_TASK
CANCEL_TASK
FINANCE_SUMMARY
TODAY_EXPENSE
RECENT_TRANSACTIONS
MONTHLY_FINANCE_SUMMARY
UNDO_LAST_TRANSACTION
CREATE_CALENDAR_EVENT
LIST_CALENDAR_EVENTS
DAILY_BRIEFING
UNKNOWN


========================================
INTENT DEFINITIONS
========================================

CREATE_TASK
Use when the user wants to create a task, reminder, or work item.

Examples:
"Tối mai làm NEXUS"
"8 giờ học Python"
"Tạo công việc học TypeScript"
"Nhắc tôi làm báo cáo"
"Mai hoàn thành báo cáo"

Extract when possible:
- title
- description
- dueAt
- priority


RECORD_EXPENSE
Use when the user reports money that was actually spent.

Examples:
"Ăn sáng 35k"
"Mua cà phê 25k"
"Ăn trưa hết 85k"
"Đổ xăng 200k"
"Chi 500k tiền điện"

Extract:
- amount
- category
- note


RECORD_INCOME
Use when the user receives money.

Examples:
"Lương 15 triệu"
"Nhận thưởng 2tr"
"Thu 4.5tr"
"Được chuyển khoản 500k"
"Nhận 1 triệu tiền freelance"

Extract:
- amount
- category
- note


RECORD_SAVING
Use when the user moves money into savings.

IMPORTANT:
Savings are NOT expenses and NOT investments.
The money still belongs to the user.

Examples:
"Để dành 2 triệu"
"Chuyển 3tr sang tài khoản tiết kiệm"
"Bỏ 500k vào quỹ tiết kiệm"
"Tiết kiệm 1 triệu"

Extract:
- amount
- category
- note


LIST_TASKS
Use when the user asks about current tasks or unfinished work.

Examples:
"Tôi còn việc gì?"
"Hôm nay còn việc gì?"
"Các task của tôi đâu?"
"Tôi còn những công việc nào?"
"Việc nào chưa hoàn thành?"


COMPLETE_TASK
Use when the user says an existing task is finished or asks to mark it done.

Examples:
"Tôi làm xong báo cáo rồi"
"Đánh dấu task học TypeScript là hoàn thành"
"Hoàn thành công việc họp team"

Extract:
- title: the identifying title or phrase of the existing task

Do NOT use CREATE_TASK when the user clearly says the work is already done.


CANCEL_TASK
Use when the user wants to cancel an existing unfinished task.

Examples:
"Hủy task học Python"
"Bỏ công việc làm báo cáo"
"Tôi không làm task họp team nữa"

Extract:
- title: the identifying title or phrase of the existing task


FINANCE_SUMMARY
Use ONLY for overall financial information.

Examples:
"Tình hình tài chính của tôi thế nào?"
"Tôi còn bao nhiêu tiền?"
"Cho tôi xem tổng quan tài chính"
"Tổng thu chi của tôi là bao nhiêu?"
"Tôi đang có bao nhiêu tiền tiết kiệm?"

IMPORTANT:
Do NOT use FINANCE_SUMMARY if the user is specifically asking
how much they spent TODAY.


TODAY_EXPENSE
Use when the user asks specifically about expenses/spending TODAY.

Examples:
"Hôm nay tôi đã tiêu bao nhiêu?"
"Hôm nay tôi chi bao nhiêu tiền?"
"Hôm nay hết bao nhiêu?"
"Nay tôi tốn bao nhiêu?"
"Tổng tiền tôi tiêu hôm nay?"
"Hôm nay tôi đã chi những gì?"

IMPORTANT PRIORITY RULE:

If the user asks specifically about TODAY's spending,
ALWAYS choose TODAY_EXPENSE.

Do NOT choose FINANCE_SUMMARY for today's spending.

Words such as:
"hôm nay"
"nay"
"trong ngày hôm nay"

combined with:
"tiêu"
"chi"
"tốn"
"hết bao nhiêu tiền"

strongly indicate TODAY_EXPENSE.


RECENT_TRANSACTIONS
Use when the user asks to view recent financial transactions.

Examples:
"Cho tôi xem giao dịch gần đây"
"Các giao dịch gần nhất của tôi"
"Tôi vừa tiêu những gì?"
"Cho tôi xem các khoản chi gần đây"
"Giao dịch mới nhất"
"5 giao dịch gần nhất"


MONTHLY_FINANCE_SUMMARY
Use when the user asks for financial results specifically for the current month.

Examples:
"Tổng kết tài chính tháng này"
"Tháng này tôi đã chi bao nhiêu theo từng danh mục?"
"Dòng tiền tháng này của tôi thế nào?"
"Xem báo cáo thu chi tháng này"

Do not use FINANCE_SUMMARY when the user explicitly asks about this month.


UNDO_LAST_TRANSACTION
Use when the user wants to remove or undo the most recently recorded
financial transaction.

Examples:
"Hoàn tác giao dịch vừa rồi"
"Xóa khoản chi tôi vừa nhập"
"Tôi nhập nhầm, bỏ giao dịch mới nhất"

This action does not need arguments.


CREATE_CALENDAR_EVENT
Use when the user wants to add an event, appointment, meeting, or
time-blocked activity to Google Calendar.

Examples:
"Mai 8 giờ họp với team"
"Thêm lịch khám bác sĩ lúc 14 giờ thứ Hai"
"Tạo lịch học TypeScript từ 19 giờ đến 21 giờ tối nay"

Extract:
- title
- description when present
- startAt as an ISO 8601 date-time with timezone
- endAt as an ISO 8601 date-time with timezone when present
- location when present

If no end time is provided, omit endAt. NEXUS will use one hour.


LIST_CALENDAR_EVENTS
Use when the user asks about their schedule or upcoming calendar events.

Examples:
"Hôm nay tôi có lịch gì?"
"Lịch tuần này của tôi"
"Cho tôi xem các sự kiện sắp tới"

Extract the requested range when possible:
- startAt as ISO 8601
- endAt as ISO 8601

If no range is provided, omit both fields. NEXUS will show the next 7 days.


DAILY_BRIEFING
Use when the user asks for a combined overview of today across their tasks,
schedule, and finances.

Examples:
"Tổng quan hôm nay của tôi"
"Cho tôi bản tin hôm nay"
"Hôm nay tôi cần chú ý những gì?"
"Tóm tắt ngày hôm nay"

Do not use this intent when the user asks only about one domain such as only
Calendar, only tasks, or only spending.


UNKNOWN
Use only when the request clearly does not match any supported intent.

Examples:
"Thời tiết hôm nay thế nào?"
"Kể cho tôi một câu chuyện"
"Bạn là ai?"


========================================
VIETNAMESE MONEY RULES
========================================

Convert Vietnamese money expressions into numbers.

Examples:

35k = 35000
50k = 50000
100k = 100000

1tr = 1000000
2tr = 2000000
1.5tr = 1500000
2.5tr = 2500000

1 triệu = 1000000
15 triệu = 15000000

4tr5 = 4500000
4tr25 = 4250000

500 nghìn = 500000
250 nghìn = 250000

When an amount is present, always return amount as a number.


========================================
CATEGORY GUIDANCE
========================================

For expenses, infer a short Vietnamese category when possible.

Examples:

"ăn sáng"
"ăn trưa"
"cà phê"
=> "Ăn uống"

"đổ xăng"
=> "Di chuyển"

"tiền điện"
"tiền nước"
=> "Hóa đơn"

"mua quần áo"
=> "Mua sắm"

If unsure:
=> "Khác"


For income:

"Lương"
=> category "Lương"

"thưởng"
=> category "Thưởng"

"freelance"
=> category "Freelance"

If unsure:
=> "Thu nhập"


For saving:

Use category:
"Tiết kiệm"


========================================
TASK PRIORITY GUIDANCE
========================================

If the user explicitly says:
"gấp"
"quan trọng"
"ưu tiên cao"
=> HIGH

If explicitly says:
"không gấp"
"ưu tiên thấp"
=> LOW

Otherwise:
=> MEDIUM


========================================
IMPORTANT ROUTING EXAMPLES
========================================

User:
"Hôm nay tôi đã tiêu bao nhiêu?"

Correct:
TODAY_EXPENSE

Incorrect:
FINANCE_SUMMARY


User:
"Tình hình tài chính của tôi thế nào?"

Correct:
FINANCE_SUMMARY


User:
"Cho tôi xem giao dịch gần đây"

Correct:
RECENT_TRANSACTIONS


User:
"Ăn sáng 35k"

Correct:
RECORD_EXPENSE


User:
"Chuyển 2 triệu sang tiết kiệm"

Correct:
RECORD_SAVING


User:
"Tôi còn những việc nào?"

Correct:
LIST_TASKS


========================================
USER MESSAGE
========================================

Current date and time: ${new Date().toISOString()}
User timezone: ${process.env.NEXUS_TIME_ZONE || 'Asia/Ho_Chi_Minh'}

"${message}"

Return JSON only.
`;

  const response =
    await getAi().models.generateContent({
      model: MODEL,

      contents: prompt,

      config: {
        responseMimeType:
          'application/json',

        responseJsonSchema: {
          type: 'object',

          properties: {
            intent: {
              type: 'string',

              enum: [
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
              ]
            },

            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },

            arguments: {
              type: 'object',

              properties: {
                title: {
                  type: 'string'
                },

                description: {
                  type: 'string'
                },

                dueAt: {
                  type: 'string'
                },

                priority: {
                  type: 'string',

                  enum: [
                    'LOW',
                    'MEDIUM',
                    'HIGH'
                  ]
                },

                amount: {
                  type: 'number'
                },

                category: {
                  type: 'string'
                },

                note: {
                  type: 'string'
                },

                startAt: {
                  type: 'string'
                },

                endAt: {
                  type: 'string'
                },

                location: {
                  type: 'string'
                }
              },

              additionalProperties:
                false
            }
          },

          required: [
            'intent',
            'confidence',
            'arguments'
          ],

          additionalProperties:
            false
        }
      }
    });

  if (!response.text) {
    throw new Error(
      'Gemini returned empty response'
    );
  }

  let parsed: NexusCommand;

  try {
    parsed = parseNexusCommand(
      JSON.parse(response.text)
    );
  } catch {
    console.error(
      'Invalid Gemini JSON:',
      response.text
    );

    throw new Error(
      'Gemini returned invalid JSON'
    );
  }

  console.log(
    '🧭 ROUTER RESULT:',
    parsed
  );

  return parsed;
};
