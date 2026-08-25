import { Router } from 'express';

import {
  analyzeCommandController,
  executeCommandController
} from './command.controller';

const router = Router();

/**
 * Chỉ phân tích.
 * Không thay đổi database.
 */
router.post(
  '/analyze',
  analyzeCommandController
);

/**
 * Phân tích + thực hiện hành động.
 */
router.post(
  '/command',
  executeCommandController
);

export default router;