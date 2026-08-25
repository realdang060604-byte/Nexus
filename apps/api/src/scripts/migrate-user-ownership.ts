import 'dotenv/config';

import mongoose from 'mongoose';

import { connectDatabase } from '../config/database';
import Task from '../modules/tasks/task.model';
import Transaction from '../modules/finance/transaction.model';

const legacyUserId = (
  process.env.LEGACY_USER_ID || 'web-local-user'
).trim();

const migrate = async (): Promise<void> => {
  if (!legacyUserId) {
    throw new Error('LEGACY_USER_ID cannot be empty');
  }

  await connectDatabase();

  const missingOwner = {
    $or: [
      { userId: { $exists: false } },
      { userId: null },
      { userId: '' }
    ]
  };

  const [tasks, transactions] = await Promise.all([
    Task.updateMany(
      missingOwner,
      { $set: { userId: legacyUserId } }
    ),
    Transaction.updateMany(
      missingOwner,
      { $set: { userId: legacyUserId } }
    )
  ]);

  console.log('User ownership migration complete:', {
    userId: legacyUserId,
    tasksUpdated: tasks.modifiedCount,
    transactionsUpdated: transactions.modifiedCount
  });
};

migrate()
  .catch(error => {
    console.error('User ownership migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
