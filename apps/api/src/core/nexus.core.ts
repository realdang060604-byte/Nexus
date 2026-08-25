import { executeCommand, CommandExecutionResult } from '../ai/command.executor';
import { routeCommand } from '../ai/command.router';
import { NexusCommand } from '../ai/command.types';
import { generateNaturalResponse } from '../ai/response.generator';
import { ConversationChannel } from '../modules/conversations/conversation.model';
import { saveConversationMessage } from '../modules/conversations/conversation.service';
import {
  consumePendingCommand,
  savePendingCommand
} from '../modules/pending-commands/pending-command.service';
import {
  describePendingCommand,
  getConfirmationAction,
  requiresConfirmation
} from './confirmation';

export interface ProcessNexusMessageInput {
  userId: string;
  channel: ConversationChannel;
  message: string;
}

export interface ProcessNexusMessageResult {
  success: boolean;
  requiresConfirmation?: boolean;
  command: NexusCommand;
  execution?: CommandExecutionResult;
  reply: string;
}

const unknownCommand = (): NexusCommand => ({
  intent: 'UNKNOWN',
  confidence: 1,
  arguments: {}
});

const saveAssistantReply = async (
  userId: string,
  channel: ConversationChannel,
  reply: string
) => saveConversationMessage({
  userId,
  channel,
  role: 'ASSISTANT',
  message: reply
});

export const processNexusMessage = async ({
  userId,
  channel,
  message
}: ProcessNexusMessageInput): Promise<ProcessNexusMessageResult> => {
  const cleanUserId = userId.trim();
  const cleanMessage = message.trim();

  if (!cleanUserId) {
    throw new Error('userId is required');
  }

  if (!cleanMessage) {
    throw new Error('message is required');
  }

  await saveConversationMessage({
    userId: cleanUserId,
    channel,
    role: 'USER',
    message: cleanMessage
  });

  const confirmationAction = getConfirmationAction(cleanMessage);

  if (confirmationAction) {
    const pending = await consumePendingCommand(cleanUserId, channel);

    if (!pending) {
      const reply = 'Không có yêu cầu nào đang chờ xác nhận.';
      await saveAssistantReply(cleanUserId, channel, reply);

      return {
        success: false,
        command: unknownCommand(),
        reply
      };
    }

    if (confirmationAction === 'CANCEL') {
      const reply = `Đã hủy yêu cầu ${describePendingCommand(pending.command)}.`;
      await saveAssistantReply(cleanUserId, channel, reply);

      return {
        success: false,
        command: pending.command,
        reply
      };
    }

    const execution = await executeCommand(pending.command, {
      userId: cleanUserId,
      channel
    });
    const reply = await generateNaturalResponse({
      userMessage: pending.originalMessage,
      command: pending.command,
      execution,
      userId: cleanUserId,
      channel
    });

    await saveAssistantReply(cleanUserId, channel, reply);

    return {
      success: execution.success !== false,
      command: pending.command,
      execution,
      reply
    };
  }

  const command = await routeCommand(cleanMessage);

  console.log(`🧠 NEXUS CORE [${channel}]:`, command);

  if (command.confidence < 0.6) {
    const reply =
      'Tôi chưa hiểu rõ yêu cầu này. Bạn hãy diễn đạt cụ thể hơn một chút.';
    await saveAssistantReply(cleanUserId, channel, reply);

    return {
      success: false,
      command,
      reply
    };
  }

  if (requiresConfirmation(command)) {
    await savePendingCommand({
      userId: cleanUserId,
      channel,
      command,
      originalMessage: cleanMessage
    });

    const reply = [
      `Mình chuẩn bị ${describePendingCommand(command)}.`,
      'Trả lời “xác nhận” để thực hiện hoặc “hủy” để bỏ qua.',
      'Yêu cầu sẽ tự hết hạn sau 10 phút.'
    ].join('\n');

    await saveAssistantReply(cleanUserId, channel, reply);

    return {
      success: false,
      requiresConfirmation: true,
      command,
      reply
    };
  }

  const execution = await executeCommand(command, {
    userId: cleanUserId,
    channel
  });

  console.log(`⚙️ NEXUS EXECUTION [${channel}]:`, execution.action);

  const reply = await generateNaturalResponse({
    userMessage: cleanMessage,
    command,
    execution,
    userId: cleanUserId,
    channel
  });

  await saveAssistantReply(cleanUserId, channel, reply);

  return {
    success: execution.success !== false,
    command,
    execution,
    reply
  };
};
