import { NexusCommand } from '../../ai/command.types';
import { ConversationChannel } from '../conversations/conversation.model';
import PendingCommand, { IPendingCommand } from './pending-command.model';

const EXPIRATION_MS = 10 * 60 * 1000;

interface SavePendingCommandInput {
  userId: string;
  channel: ConversationChannel;
  command: NexusCommand;
  originalMessage: string;
}

export const savePendingCommand = async (
  input: SavePendingCommandInput
): Promise<IPendingCommand> => {
  const expiresAt = new Date(Date.now() + EXPIRATION_MS);

  return PendingCommand.findOneAndUpdate(
    {
      userId: input.userId,
      channel: input.channel
    },
    {
      $set: {
        command: input.command,
        originalMessage: input.originalMessage,
        expiresAt
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true
    }
  );
};

export const getPendingCommand = async (
  userId: string,
  channel: ConversationChannel
): Promise<IPendingCommand | null> => {
  const pending = await PendingCommand.findOne({
    userId,
    channel,
    expiresAt: { $gt: new Date() }
  });

  if (!pending) {
    await PendingCommand.deleteMany({ userId, channel });
  }

  return pending;
};

export const clearPendingCommand = async (
  userId: string,
  channel: ConversationChannel
) => PendingCommand.deleteOne({ userId, channel });

export const consumePendingCommand = async (
  userId: string,
  channel: ConversationChannel
): Promise<IPendingCommand | null> => PendingCommand.findOneAndDelete({
  userId,
  channel,
  expiresAt: { $gt: new Date() }
});
