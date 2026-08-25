import {
  createTransaction,
  getFinanceSummary,
  getMonthlyFinanceSummary,
  getRecentTransactions,
  getTodayExpense,
  undoLatestTransaction
} from '../modules/finance/finance.service';

import {
  NexusTool
} from './tool.types';

/* ==========================================
   TYPES
========================================== */

interface RecordMoneyInput {
  amount: number;
  category?: string;
  note?: string;
}

/* ==========================================
   RECORD EXPENSE
========================================== */

export const recordExpenseTool:
NexusTool<RecordMoneyInput> = {
  name: 'RECORD_EXPENSE',

  description:
    'Record an expense transaction.',

  async execute(input, context) {
    if (
      !input.amount ||
      input.amount <= 0
    ) {
      throw new Error(
        'RECORD_EXPENSE requires valid amount'
      );
    }

    const transaction =
      await createTransaction({
        userId:
          context.userId,
        amount:
          input.amount,

        type:
          'EXPENSE',

        category:
          input.category ||
          'Khác',

        note:
          input.note ||
          '',

        source:
          'AI'
      });

    return {
      action:
        'RECORD_EXPENSE',

      message:
        `Đã ghi chi ${input.amount.toLocaleString('vi-VN')}đ`,

      data:
        transaction
    };
  }
};

/* ==========================================
   RECORD INCOME
========================================== */

export const recordIncomeTool:
NexusTool<RecordMoneyInput> = {
  name: 'RECORD_INCOME',

  description:
    'Record an income transaction.',

  async execute(input, context) {
    if (
      !input.amount ||
      input.amount <= 0
    ) {
      throw new Error(
        'RECORD_INCOME requires valid amount'
      );
    }

    const transaction =
      await createTransaction({
        userId:
          context.userId,
        amount:
          input.amount,

        type:
          'INCOME',

        category:
          input.category ||
          'Thu nhập',

        note:
          input.note ||
          '',

        source:
          'AI'
      });

    return {
      action:
        'RECORD_INCOME',

      message:
        `Đã ghi thu ${input.amount.toLocaleString('vi-VN')}đ`,

      data:
        transaction
    };
  }
};

/* ==========================================
   RECORD SAVING
========================================== */

export const recordSavingTool:
NexusTool<RecordMoneyInput> = {
  name: 'RECORD_SAVING',

  description:
    'Record money moved into savings.',

  async execute(input, context) {
    if (
      !input.amount ||
      input.amount <= 0
    ) {
      throw new Error(
        'RECORD_SAVING requires valid amount'
      );
    }

    const transaction =
      await createTransaction({
        userId:
          context.userId,
        amount:
          input.amount,

        type:
          'SAVING',

        category:
          input.category ||
          'Tiết kiệm',

        note:
          input.note ||
          'Chuyển sang tài khoản tiết kiệm',

        source:
          'AI'
      });

    return {
      action:
        'RECORD_SAVING',

      message:
        `Đã ghi tiết kiệm ${input.amount.toLocaleString('vi-VN')}đ`,

      data:
        transaction
    };
  }
};

/* ==========================================
   FINANCE SUMMARY
========================================== */

export const financeSummaryTool:
NexusTool<Record<string, never>> = {
  name:
    'FINANCE_SUMMARY',

  description:
    'Get overall finance summary.',

  async execute(_input, context) {
    const summary =
      await getFinanceSummary(
        context.userId
      );

    return {
      action:
        'FINANCE_SUMMARY',

      message:
        'Đã tổng hợp tình hình tài chính của bạn.',

      data:
        summary
    };
  }
};

/* ==========================================
   TODAY EXPENSE
========================================== */

export const todayExpenseTool:
NexusTool<Record<string, never>> = {
  name:
    'TODAY_EXPENSE',

  description:
    'Get total spending for today.',

  async execute(_input, context) {
    const result =
      await getTodayExpense(
        context.userId
      );

    if (
      result.count === 0
    ) {
      return {
        action:
          'TODAY_EXPENSE',

        message:
          'Hôm nay bạn chưa ghi nhận khoản chi nào.',

        data:
          result
      };
    }

    return {
      action:
        'TODAY_EXPENSE',

      message:
        `Hôm nay bạn đã chi ${result.total.toLocaleString('vi-VN')}đ qua ${result.count} giao dịch.`,

      data:
        result
    };
  }
};

/* ==========================================
   RECENT TRANSACTIONS
========================================== */

export const recentTransactionsTool:
NexusTool<Record<string, never>> = {
  name:
    'RECENT_TRANSACTIONS',

  description:
    'Get recent financial transactions.',

  async execute(_input, context) {
    const transactions =
      await getRecentTransactions(
        context.userId,
        5
      );

    return {
      action:
        'RECENT_TRANSACTIONS',

      message:
        transactions.length === 0
          ? 'Bạn chưa có giao dịch nào.'
          : `Đây là ${transactions.length} giao dịch gần nhất của bạn.`,

      data:
        transactions
    };
  }
};

/* ==========================================
   MONTHLY SUMMARY
========================================== */

export const monthlyFinanceSummaryTool:
NexusTool<Record<string, never>> = {
  name: 'MONTHLY_FINANCE_SUMMARY',
  description: 'Summarize finances for the current month by category.',

  async execute(_input, context) {
    const summary = await getMonthlyFinanceSummary(context.userId);

    return {
      action: 'MONTHLY_FINANCE_SUMMARY',
      message: summary.transactionCount === 0
        ? 'Tháng này bạn chưa có giao dịch nào.'
        : `Tháng này bạn đã chi ${summary.totalExpense.toLocaleString('vi-VN')}đ qua ${summary.transactionCount} giao dịch.`,
      data: summary
    };
  }
};

/* ==========================================
   UNDO LATEST TRANSACTION
========================================== */

export const undoLastTransactionTool:
NexusTool<Record<string, never>> = {
  name: 'UNDO_LAST_TRANSACTION',
  description: 'Delete the most recently recorded transaction.',

  async execute(_input, context) {
    const transaction = await undoLatestTransaction(context.userId);

    if (!transaction) {
      return {
        success: false,
        action: 'UNDO_LAST_TRANSACTION',
        message: 'Bạn chưa có giao dịch nào để hoàn tác.'
      };
    }

    return {
      success: true,
      action: 'UNDO_LAST_TRANSACTION',
      message: `Đã hoàn tác giao dịch ${transaction.amount.toLocaleString('vi-VN')}đ (${transaction.category}).`,
      data: transaction
    };
  }
};
