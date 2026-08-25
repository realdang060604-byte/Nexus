import { getAi } from './ai.client';

import {
  NexusCommand
} from './command.types';

import {
  CommandExecutionResult
} from './command.executor';

import {
  ConversationChannel,
  IConversationMessage
} from '../modules/conversations/conversation.model';

import {
  getRecentConversation
} from '../modules/conversations/conversation.service';

const MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash-lite';

interface GenerateResponseInput {
  userMessage: string;

  command: NexusCommand;

  execution: CommandExecutionResult;

  userId?: string;

  channel?: ConversationChannel;
}

/* ==========================================
   FORMAT CONVERSATION HISTORY
========================================== */

const formatConversationHistory = (
  messages: IConversationMessage[]
): string => {
  if (
    !messages ||
    messages.length === 0
  ) {
    return 'No previous conversation.';
  }

  return messages
    .map(message => {
      const role =
        message.role === 'USER'
          ? 'User'
          : 'NEXUS';

      return `${role}: ${message.message}`;
    })
    .join('\n');
};

/* ==========================================
   GENERATE NATURAL RESPONSE
========================================== */

export const generateNaturalResponse =
  async ({
    userMessage,
    command,
    execution,
    userId,
    channel
  }: GenerateResponseInput):
  Promise<string> => {

    let history:
      IConversationMessage[] = [];

    /*
      Nếu có userId + channel
      thì lấy lịch sử gần nhất.

      Nếu Web chưa truyền userId,
      NEXUS vẫn hoạt động bình thường.
    */

    if (
      userId &&
      channel
    ) {
      try {
        history =
          await getRecentConversation(
            userId,
            channel,
            10
          );
      } catch (error) {
        console.error(
          '⚠️ Failed to load conversation history:',
          error
        );
      }
    }

    const historyText =
      formatConversationHistory(
        history
      );

    const prompt = `
You are NEXUS, a personal AI assistant.

You are responding to a Vietnamese user.

========================================
YOUR ROLE
========================================

Respond naturally, clearly, and concisely in Vietnamese.

You may use the recent conversation history to understand context.

However, factual information about tasks, finances, transactions, or completed actions MUST come from the execution result.

========================================
IMPORTANT RULES
========================================

1. Use the execution result as the source of truth.

2. Never invent:
- financial values
- transactions
- tasks
- dates
- completed actions

3. Never claim an action succeeded unless the execution result confirms it.

4. Conversation history is contextual information only.

5. If conversation history conflicts with execution data, trust execution data.

6. Never expose internal technical concepts such as:
- intent
- router
- executor
- MongoDB
- JSON
- API
- database queries

7. Keep responses useful but not unnecessarily long.

8. Format Vietnamese currency naturally.

Example:
85000
=> 85.000đ

15000000
=> 15.000.000đ

9. Use emojis sparingly when they improve readability.

10. Do not repeat the user's entire message.

========================================
RECENT CONVERSATION
========================================

${historyText}

========================================
CURRENT USER MESSAGE
========================================

${JSON.stringify(userMessage)}

========================================
DETECTED COMMAND
========================================

${JSON.stringify(command)}

========================================
EXECUTION RESULT
========================================

${JSON.stringify(execution)}

========================================
FINAL RESPONSE
========================================

Write the final Vietnamese response only.
Do not return JSON.
`;

    try {
      const response =
        await getAi().models.generateContent({
          model: MODEL,
          contents: prompt
        });

      const text =
        response.text?.trim();

      if (!text) {
        return execution.message;
      }

      return text;

    } catch (error) {
      console.error(
        '❌ NEXUS response generation error:',
        error
      );

      /*
        Gemini response generator lỗi
        thì vẫn trả message từ executor.
      */

      return execution.message;
    }
  };
