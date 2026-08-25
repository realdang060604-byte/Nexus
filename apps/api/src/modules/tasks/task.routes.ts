import { Router } from 'express';

import {
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksController,
  updateTaskController
} from './task.controller';

const router = Router();

router.post('/', createTaskController);

router.get('/', getTasksController);

router.get('/:id', getTaskByIdController);

router.patch('/:id', updateTaskController);

router.delete('/:id', deleteTaskController);

export default router;