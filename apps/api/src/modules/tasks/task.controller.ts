import {
  Request,
  Response
} from 'express';

import mongoose from 'mongoose';

import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask
} from './task.service';

import {
  TaskPriority,
  TaskStatus
} from './task.model';

import { getRequestUserId } from '../../http/request-user';

const TASK_PRIORITIES: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH'
];

const TASK_STATUSES: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED'
];

/* ==========================================
   CREATE TASK
========================================== */

export const createTaskController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        title,
        description,
        priority,
        dueAt,
        tags,
        source
      } = req.body;

      if (
        !title ||
        typeof title !== 'string' ||
        !title.trim()
      ) {
        res.status(400).json({
          success: false,
          message:
            'Task title is required'
        });

        return;
      }

      let parsedDueAt:
        Date | undefined;

      if (dueAt) {
        const date =
          new Date(dueAt);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          res.status(400).json({
            success: false,
            message:
              'Invalid dueAt date'
          });

          return;
        }

        parsedDueAt =
          date;
      }

      if (
        priority !== undefined &&
        !TASK_PRIORITIES.includes(priority)
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid task priority'
        });

        return;
      }

      if (
        description !== undefined &&
        typeof description !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: 'Description must be a string'
        });

        return;
      }

      const task =
        await createTask({
          userId:
            getRequestUserId(req),
          title:
            title.trim(),

          description:
            description || '',

          priority:
            priority || 'MEDIUM',

          dueAt:
            parsedDueAt,

          tags:
            Array.isArray(tags)
              ? tags
              : [],

          source:
            source || 'WEB'
        });

      res.status(201).json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error(
        'Create task error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create task'
      });
    }
  };

/* ==========================================
   GET ALL TASKS
========================================== */

export const getTasksController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tasks =
        await getTasks(
          getRequestUserId(req)
        );

      res.status(200).json({
        success: true,
        data: tasks
      });

    } catch (error) {
      console.error(
        'Get tasks error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to get tasks'
      });
    }
  };

/* ==========================================
   GET TASK BY ID
========================================== */

export const getTaskByIdController =
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
            'Invalid task id'
        });

        return;
      }

      const task =
        await getTaskById(
          id,
          getRequestUserId(req)
        );

      if (!task) {
        res.status(404).json({
          success: false,
          message:
            'Task not found'
        });

        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error(
        'Get task error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to get task'
      });
    }
  };

/* ==========================================
   UPDATE TASK
========================================== */

export const updateTaskController =
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
            'Invalid task id'
        });

        return;
      }

      const allowedFields = new Set([
        'title',
        'description',
        'status',
        'priority',
        'dueAt',
        'tags'
      ]);

      const unsupportedFields = Object.keys(
        req.body
      ).filter(key => !allowedFields.has(key));

      if (unsupportedFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Unsupported task fields: ${unsupportedFields.join(', ')}`
        });

        return;
      }

      const updateData: Record<string, unknown> = {
        ...req.body
      };

      if (
        updateData.title !== undefined &&
        (
          typeof updateData.title !== 'string' ||
          !updateData.title.trim()
        )
      ) {
        res.status(400).json({
          success: false,
          message: 'Task title cannot be empty'
        });

        return;
      }

      if (
        updateData.description !== undefined &&
        typeof updateData.description !== 'string'
      ) {
        res.status(400).json({
          success: false,
          message: 'Description must be a string'
        });

        return;
      }

      if (
        updateData.status !== undefined &&
        !TASK_STATUSES.includes(updateData.status as TaskStatus)
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid task status'
        });

        return;
      }

      if (
        updateData.priority !== undefined &&
        !TASK_PRIORITIES.includes(updateData.priority as TaskPriority)
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid task priority'
        });

        return;
      }

      if (
        updateData.tags !== undefined &&
        (
          !Array.isArray(updateData.tags) ||
          updateData.tags.some(tag => typeof tag !== 'string')
        )
      ) {
        res.status(400).json({
          success: false,
          message: 'Tags must be an array of strings'
        });

        return;
      }

      if (updateData.dueAt !== undefined) {
        if (updateData.dueAt === null) {
          // Explicit null removes a due date.
        } else {
          const date = new Date(updateData.dueAt as string);

          if (Number.isNaN(date.getTime())) {
            res.status(400).json({
              success: false,
              message: 'Invalid dueAt date'
            });

            return;
          }

          updateData.dueAt = date;
        }

        updateData.reminderSentAt = null;
        updateData.reminderClaimedAt = null;
      }

      const task =
        await updateTask(
          id,
          getRequestUserId(req),
          updateData
        );

      if (!task) {
        res.status(404).json({
          success: false,
          message:
            'Task not found'
        });

        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });

    } catch (error) {
      console.error(
        'Update task error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update task'
      });
    }
  };

/* ==========================================
   DELETE TASK
========================================== */

export const deleteTaskController =
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
            'Invalid task id'
        });

        return;
      }

      const task =
        await deleteTask(
          id,
          getRequestUserId(req)
        );

      if (!task) {
        res.status(404).json({
          success: false,
          message:
            'Task not found'
        });

        return;
      }

      res.status(200).json({
        success: true,
        message:
          'Task deleted successfully',
        data: task
      });

    } catch (error) {
      console.error(
        'Delete task error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to delete task'
      });
    }
  };
