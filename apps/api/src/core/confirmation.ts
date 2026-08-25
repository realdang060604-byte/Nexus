import { NexusCommand, NexusIntent } from '../ai/command.types';

export type ConfirmationAction = 'CONFIRM' | 'CANCEL' | null;

const MUTATING_INTENTS = new Set<NexusIntent>([
  'CREATE_TASK',
  'COMPLETE_TASK',
  'CANCEL_TASK',
  'UNDO_LAST_TRANSACTION',
  'CREATE_CALENDAR_EVENT'
]);

const normalize = (message: string): string => message
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const getConfirmationAction = (
  message: string
): ConfirmationAction => {
  const value = normalize(message);

  if (['huy', 'huy bo', 'khong', 'thoi'].includes(value)) {
    return 'CANCEL';
  }

  if (
    ['xac nhan', 'dong y', 'ok', 'okay', 'thuc hien'].includes(value)
  ) {
    return 'CONFIRM';
  }

  return null;
};

export const requiresConfirmation = (
  command: NexusCommand
): boolean => MUTATING_INTENTS.has(command.intent);

export const describePendingCommand = (
  command: NexusCommand
): string => {
  const args = command.arguments;

  switch (command.intent) {
    case 'CREATE_TASK':
      return `tạo công việc “${args.title || 'Không có tiêu đề'}”`;
    case 'COMPLETE_TASK':
      return `đánh dấu hoàn thành công việc “${args.title || 'Không rõ tên'}”`;
    case 'CANCEL_TASK':
      return `hủy công việc “${args.title || 'Không rõ tên'}”`;
    case 'RECORD_EXPENSE':
      return `ghi khoản chi ${(args.amount || 0).toLocaleString('vi-VN')}đ`;
    case 'RECORD_INCOME':
      return `ghi khoản thu ${(args.amount || 0).toLocaleString('vi-VN')}đ`;
    case 'RECORD_SAVING':
      return `ghi khoản tiết kiệm ${(args.amount || 0).toLocaleString('vi-VN')}đ`;
    case 'UNDO_LAST_TRANSACTION':
      return 'xóa giao dịch được ghi gần nhất';
    case 'CREATE_CALENDAR_EVENT':
      return `tạo sự kiện “${args.title || 'Không có tiêu đề'}”`;
    default:
      return 'thực hiện yêu cầu này';
  }
};
