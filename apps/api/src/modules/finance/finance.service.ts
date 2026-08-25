import Transaction, {
  ITransaction,
  TransactionSource,
  TransactionType
} from './transaction.model';
import { getVietnamDayRange } from '../../utils/vietnam-time';

interface CreateTransactionInput {
  userId: string;
  amount: number;
  type: TransactionType;
  category?: string;
  note?: string;
  source?: TransactionSource;
  occurredAt?: Date;
}

/* ==========================================
   CREATE TRANSACTION
========================================== */

export const createTransaction = async (
  input: CreateTransactionInput
): Promise<ITransaction> => {
  const userId = input.userId.trim();

  if (!userId) {
    throw new Error('Transaction userId is required');
  }

  const transaction = await Transaction.create({
    userId,
    amount: input.amount,
    type: input.type,
    category: input.category || 'Khác',
    note: input.note || '',
    source: input.source || 'MANUAL',
    occurredAt: input.occurredAt || new Date()
  });

  return transaction;
};

/* ==========================================
   GET ALL TRANSACTIONS
========================================== */

export const getTransactions = async (
  userId: string
):
Promise<ITransaction[]> => {
  return Transaction.find({ userId }).sort({
    occurredAt: -1,
    createdAt: -1
  });
};

/* ==========================================
   GET RECENT TRANSACTIONS
========================================== */

export const getRecentTransactions = async (
  userId: string,
  limit = 5
): Promise<ITransaction[]> => {
  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), 50)
      : 5;

  return Transaction.find({ userId })
    .sort({
      occurredAt: -1,
      createdAt: -1
    })
    .limit(safeLimit);
};

/* ==========================================
   DELETE TRANSACTION
========================================== */

export const deleteTransaction = async (
  id: string,
  userId: string
): Promise<ITransaction | null> => {
  return Transaction.findOneAndDelete({ _id: id, userId });
};

/* ==========================================
   FINANCE SUMMARY
========================================== */

export const getFinanceSummary = async (
  userId: string
) => {
  const transactions =
    await Transaction.find({ userId });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaving = 0;

  for (const transaction of transactions) {
    switch (transaction.type) {
      case 'INCOME':
        totalIncome += transaction.amount;
        break;

      case 'EXPENSE':
        totalExpense += transaction.amount;
        break;

      case 'SAVING':
        totalSaving += transaction.amount;
        break;
    }
  }

  /*
    totalBalance:
    Tổng tiền bạn vẫn sở hữu.

    SAVING không bị trừ khỏi totalBalance
    vì tiền tiết kiệm vẫn là tiền của bạn.
  */

  const totalBalance =
    totalIncome - totalExpense;

  /*
    spendingBalance:
    Số tiền còn sẵn sàng để chi tiêu.

    Tiền SAVING được tách riêng khỏi
    khoản tiền có thể dùng hàng ngày.
  */

  const spendingBalance =
    totalBalance - totalSaving;

  return {
    totalIncome,
    totalExpense,
    totalSaving,
    totalBalance,
    spendingBalance
  };
};

/* ==========================================
   TODAY EXPENSE
========================================== */

export const getTodayExpense = async (
  userId: string
) => {
  const { from, to } = getVietnamDayRange();

  const transactions =
    await Transaction.find({
      userId,
      type: 'EXPENSE',

      occurredAt: {
        $gte: from,
        $lt: to
      }
    }).sort({
      occurredAt: -1,
      createdAt: -1
    });

  const total =
    transactions.reduce(
      (
        sum,
        transaction
      ) => {
        return (
          sum +
          transaction.amount
        );
      },
      0
    );

  return {
    total,
    count:
      transactions.length,
    transactions
  };
};

/* ==========================================
   CURRENT MONTH SUMMARY
========================================== */

export const getMonthlyFinanceSummary = async (
  userId: string,
  referenceDate = new Date()
) => {
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;
  const vietnamReference = new Date(
    referenceDate.getTime() + vietnamOffsetMs
  );
  const year = vietnamReference.getUTCFullYear();
  const monthIndex = vietnamReference.getUTCMonth();
  const from = new Date(
    Date.UTC(year, monthIndex, 1) - vietnamOffsetMs
  );
  const to = new Date(
    Date.UTC(year, monthIndex + 1, 1) - vietnamOffsetMs
  );
  const transactions = await Transaction.find({
    userId,
    occurredAt: { $gte: from, $lt: to }
  }).sort({ occurredAt: -1, createdAt: -1 });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaving = 0;
  const expenseCategories = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type === 'INCOME') {
      totalIncome += transaction.amount;
    } else if (transaction.type === 'SAVING') {
      totalSaving += transaction.amount;
    } else {
      totalExpense += transaction.amount;
      expenseCategories.set(
        transaction.category,
        (expenseCategories.get(transaction.category) || 0) +
          transaction.amount
      );
    }
  }

  return {
    month: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    from,
    to,
    totalIncome,
    totalExpense,
    totalSaving,
    netCashFlow: totalIncome - totalExpense - totalSaving,
    transactionCount: transactions.length,
    expenseByCategory: Array.from(expenseCategories.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((left, right) => right.amount - left.amount)
  };
};

/* ==========================================
   UNDO LATEST TRANSACTION
========================================== */

export const undoLatestTransaction = async (
  userId: string
): Promise<ITransaction | null> => Transaction.findOneAndDelete(
  { userId },
  { sort: { occurredAt: -1, createdAt: -1 } }
);
