import { Router } from 'express';

import {
  createTransactionController,
  deleteTransactionController,
  getFinanceSummaryController,
  getTransactionsController
} from './finance.controller';

const router = Router();

router.post('/transactions', createTransactionController);

router.get('/transactions', getTransactionsController);

router.get('/summary', getFinanceSummaryController);

router.delete(
  '/transactions/:id',
  deleteTransactionController
);

export default router;