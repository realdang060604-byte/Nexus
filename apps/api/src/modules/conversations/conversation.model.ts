import {
  Document,
  model,
  Schema
} from 'mongoose';

export type ConversationChannel =
  | 'WEB'
  | 'TELEGRAM';

export type ConversationRole =
  | 'USER'
  | 'ASSISTANT';

export interface IConversationMessage
  extends Document {
  userId: string;

  channel: ConversationChannel;

  role: ConversationRole;

  message: string;

  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema =
  new Schema<IConversationMessage>(
    {
      userId: {
        type: String,
        required: true,
        trim: true,
        index: true
      },

      channel: {
        type: String,
        enum: [
          'WEB',
          'TELEGRAM'
        ],
        required: true,
        index: true
      },

      role: {
        type: String,
        enum: [
          'USER',
          'ASSISTANT'
        ],
        required: true
      },

      message: {
        type: String,
        required: true,
        trim: true
      }
    },
    {
      timestamps: true
    }
  );

/*
  Index này giúp NEXUS lấy lịch sử
  theo user nhanh hơn.
*/

conversationSchema.index({
  userId: 1,
  channel: 1,
  createdAt: -1
});

const ConversationMessage =
  model<IConversationMessage>(
    'ConversationMessage',
    conversationSchema
  );

export default ConversationMessage;