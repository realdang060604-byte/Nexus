import {
  Request,
  Response
} from 'express';

import mongoose from 'mongoose';

import {
  createTransaction,
  deleteTransaction,
  getFinanceSummary,
  getTransactions
} from './finance.service';

import {
  TransactionSource,
  TransactionType
} from './transaction.model';

import { getRequestUserId } from '../../http/request-user';

/* ==========================================
   CREATE TRANSACTION
========================================== */

export const createTransactionController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        amount,
        type,
        category,
        note,
        source,
        occurredAt
      } = req.body;

      if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        res.status(400).json({
          success: false,
          message:
            'Amount must be greater than 0'
        });

        return;
      }

      const validTypes:
        TransactionType[] = [
          'INCOME',
          'EXPENSE',
          'SAVING'
        ];

      if (
        !type ||
        !validTypes.includes(type)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid transaction type'
        });

        return;
      }

      const validSources:
        TransactionSource[] = [
          'WEB',
          'TELEGRAM',
          'AI',
          'MANUAL'
        ];

      if (
        source !== undefined &&
        !validSources.includes(source)
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid transaction source'
        });

        return;
      }

      if (
        category !== undefined &&
        typeof category !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: 'Category must be a string'
        });

        return;
      }

      if (
        note !== undefined &&
        typeof note !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: 'Note must be a string'
        });

        return;
      }

      let parsedOccurredAt:
        Date | undefined;

      if (occurredAt) {
        const date =
          new Date(occurredAt);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid occurredAt date'
          });

          return;
        }

        parsedOccurredAt =
          date;
      }

      const transaction =
        await createTransaction({
          userId:
            getRequestUserId(req),
          amount,
          type,
          category,
          note,
          source,
          occurredAt:
            parsedOccurredAt
        });

      res.status(201).json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error(
        'Create transaction error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create transaction'
      });
    }
  };

/* ==========================================
   GET TRANSACTIONS
========================================== */

export const getTransactionsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const transactions =
        await getTransactions(
          getRequestUserId(req)
        );

      res.status(200).json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error(
        'Get transactions error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to get transactions'
      });
    }
  };

/* ==========================================
   FINANCE SUMMARY
========================================== */

export const getFinanceSummaryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const summary =
        await getFinanceSummary(
          getRequestUserId(req)
        );

      res.status(200).json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error(
        'Finance summary error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to get finance summary'
      });
    }
  };

/* ==========================================
   DELETE TRANSACTION
========================================== */

export const deleteTransactionController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const rawId =
        req.params.id;

      const id =
        Array.isArray(rawId)
          ? rawId[0]
          : rawId;

      if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid transaction id'
        });

        return;
      }

      const transaction =
        await deleteTransaction(
          id,
          getRequestUserId(req)
        );

      if (!transaction) {
        res.status(404).json({
          success: false,
          message:
            'Transaction not found'
        });

        return;
      }

      res.status(200).json({
        success: true,
        message:
          'Transaction deleted successfully',
        data: transaction
      });

    } catch (error) {
      console.error(
        'Delete transaction error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to delete transaction'
      });
    }
  };
