import ConversationMessage, {
  ConversationChannel,
  ConversationRole,
  IConversationMessage
} from './conversation.model';

interface SaveMessageInput {
  userId: string;

  channel: ConversationChannel;

  role: ConversationRole;

  message: string;
}

/* ==========================================
   SAVE MESSAGE
========================================== */

export const saveConversationMessage =
  async (
    input: SaveMessageInput
  ): Promise<IConversationMessage> => {

    const cleanUserId =
      input.userId.trim();

    const cleanMessage =
      input.message.trim();

    if (!cleanUserId) {
      throw new Error(
        'Conversation userId is required'
      );
    }

    if (!cleanMessage) {
      throw new Error(
        'Conversation message is required'
      );
    }

    const savedMessage =
      await ConversationMessage.create({
        userId:
          cleanUserId,

        channel:
          input.channel,

        role:
          input.role,

        message:
          cleanMessage
      });

    return savedMessage;
  };

/* ==========================================
   GET RECENT HISTORY
========================================== */

export const getRecentConversation =
  async (
    userId: string,
    channel: ConversationChannel,
    limit = 10
  ): Promise<IConversationMessage[]> => {

    const safeLimit =
      Number.isFinite(limit) &&
      limit > 0
        ? Math.min(
            Math.floor(limit),
            50
          )
        : 10;

    /*
      Mongo lấy từ mới → cũ.
    */

    const messages =
      await ConversationMessage.find({
        userId,
        channel
      })
        .sort({
          createdAt: -1
        })
        .limit(
          safeLimit
        );

    /*
      Đảo lại thành:
      cũ → mới

      để AI đọc hội thoại
      theo đúng thứ tự.
    */

    return messages.reverse();
  };

/* ==========================================
   GET HISTORY ACROSS CHANNELS
========================================== */

export const getRecentUserConversation =
  async (
    userId: string,
    limit = 10
  ): Promise<IConversationMessage[]> => {

    const safeLimit =
      Number.isFinite(limit) &&
      limit > 0
        ? Math.min(
            Math.floor(limit),
            50
          )
        : 10;

    const messages =
      await ConversationMessage.find({
        userId
      })
        .sort({
          createdAt: -1
        })
        .limit(
          safeLimit
        );

    return messages.reverse();
  };

/* ==========================================
   DELETE USER HISTORY
========================================== */

export const clearConversation =
  async (
    userId: string,
    channel?: ConversationChannel
  ) => {

    if (channel) {
      return ConversationMessage.deleteMany({
        userId,
        channel
      });
    }

    return ConversationMessage.deleteMany({
      userId
    });
  };