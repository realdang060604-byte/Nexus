import { Document, model, Schema } from 'mongoose';

import { NexusCommand } from '../../ai/command.types';
import { ConversationChannel } from '../conversations/conversation.model';

export interface IPendingCommand extends Document {
  userId: string;
  channel: ConversationChannel;
  command: NexusCommand;
  originalMessage: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pendingCommandSchema = new Schema<IPendingCommand>(
  {
    userId: {
      type: String,
      required: true,
      trim: true
    },
    channel: {
      type: String,
      enum: ['WEB', 'TELEGRAM'],
      required: true
    },
    command: {
      type: Schema.Types.Mixed,
      required: true
    },
    originalMessage: {
      type: String,
      required: true,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

pendingCommandSchema.index(
  { userId: 1, channel: 1 },
  { unique: true }
);
pendingCommandSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default model<IPendingCommand>(
  'PendingCommand',
  pendingCommandSchema
);
