import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'SAVING';

export type TransactionSource =
  | 'WEB'
  | 'TELEGRAM'
  | 'AI'
  | 'MANUAL';

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  source: TransactionSource;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
    {
      userId: {
        type: String,
        required: true,
        trim: true,
        index: true
      },

      amount: {
      type: Number,
      required: true,
      min: 0
    },

    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'SAVING'],
      required: true
    },

    category: {
      type: String,
      default: 'Khác',
      trim: true
    },

    note: {
      type: String,
      default: '',
      trim: true
    },

    source: {
      type: String,
      enum: ['WEB', 'TELEGRAM', 'AI', 'MANUAL'],
      default: 'WEB'
    },

    occurredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({
  userId: 1,
  occurredAt: -1,
  createdAt: -1
});

const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);

export default Transaction;
