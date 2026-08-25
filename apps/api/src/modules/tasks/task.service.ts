import {
  QueryFilter,
  UpdateQuery
} from 'mongoose';

import Task, {
  ITask,
  TaskPriority,
  TaskStatus
} from './task.model';

interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: Date;
  tags?: string[];
  source?: string;
}

/* ==========================================
   CREATE TASK
========================================== */

export const createTask = async (
  input: CreateTaskInput
): Promise<ITask> => {
  const userId = input.userId.trim();

  if (!userId) {
    throw new Error('Task userId is required');
  }

  const taskData: CreateTaskInput = {
    userId,
    title: input.title,
    description: input.description || '',
    status: input.status || 'TODO',
    priority: input.priority || 'MEDIUM',
    tags: input.tags || [],
    source: input.source || 'WEB'
  };

  // Chỉ thêm dueAt nếu thực sự có giá trị Date
  if (input.dueAt) {
    taskData.dueAt = input.dueAt;
  }

  const task = await Task.create(
    taskData
  );

  return task;
};

/* ==========================================
   GET ALL TASKS
========================================== */

export const getTasks = async (
  userId: string
):
Promise<ITask[]> => {
  return Task.find({ userId }).sort({
    createdAt: -1
  });
};

/* ==========================================
   GET TASK BY ID
========================================== */

export const getTaskById = async (
  id: string,
  userId: string
): Promise<ITask | null> => {
  return Task.findOne({ _id: id, userId });
};

/* ==========================================
   UPDATE TASK
========================================== */

export const updateTask = async (
  id: string,
  userId: string,
  update: UpdateQuery<ITask>
): Promise<ITask | null> => {
  return Task.findOneAndUpdate(
    { _id: id, userId },
    update,
    {
      returnDocument: 'after',
      runValidators: true
    }
  );
};

/* ==========================================
   DELETE TASK
========================================== */

export const deleteTask = async (
  id: string,
  userId: string
): Promise<ITask | null> => {
  return Task.findOneAndDelete({ _id: id, userId });
};

/* ==========================================
   TELEGRAM REMINDERS
========================================== */

export const claimNextTelegramReminder = async (
  from: Date,
  to: Date,
  claimedAt: Date,
  staleBefore: Date
): Promise<ITask | null> => Task.findOneAndUpdate(
  {
    userId: /^\d+$/,
    status: { $in: ['TODO', 'IN_PROGRESS'] },
    dueAt: { $gte: from, $lte: to },
    reminderSentAt: null,
    $or: [
      { reminderClaimedAt: null },
      { reminderClaimedAt: { $exists: false } },
      { reminderClaimedAt: { $lte: staleBefore } }
    ]
  },
  { $set: { reminderClaimedAt: claimedAt } },
  {
    returnDocument: 'after',
    sort: { dueAt: 1 }
  }
);

export const releaseTaskReminder = async (
  taskId: string,
  claimedAt: Date
): Promise<void> => {
  await Task.updateOne(
    {
      _id: taskId,
      reminderClaimedAt: claimedAt
    },
    { $set: { reminderClaimedAt: null } }
  );
};

export const markTaskReminderSent = async (
  taskId: string,
  claimedAt: Date,
  sentAt: Date
): Promise<void> => {
  await Task.updateOne(
    { _id: taskId, reminderClaimedAt: claimedAt, reminderSentAt: null },
    { $set: { reminderSentAt: sentAt, reminderClaimedAt: null } }
  );
};

/* ==========================================
   UPDATE TASK BY NATURAL TITLE
========================================== */

export interface TaskTitleUpdateResult {
  status: 'UPDATED' | 'NOT_FOUND' | 'AMBIGUOUS';
  task?: ITask;
  candidates?: string[];
}

const escapeRegex = (value: string): string => value.replace(
  /[.*+?^${}()|[\]\\]/g,
  '\\$&'
);

export const updateTaskStatusByTitle = async (
  userId: string,
  title: string,
  status: 'DONE' | 'CANCELLED'
): Promise<TaskTitleUpdateResult> => {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return { status: 'NOT_FOUND' };
  }

  const activeFilter: QueryFilter<ITask> = {
    userId,
    status: { $in: ['TODO', 'IN_PROGRESS'] }
  };
  const escapedTitle = escapeRegex(cleanTitle);
  const exactMatches = await Task.find({
    ...activeFilter,
    title: new RegExp(`^${escapedTitle}$`, 'i')
  }).limit(2);
  const matches = exactMatches.length > 0
    ? exactMatches
    : await Task.find({
        ...activeFilter,
        title: new RegExp(escapedTitle, 'i')
      }).limit(6);

  if (matches.length === 0) {
    return { status: 'NOT_FOUND' };
  }

  if (matches.length > 1) {
    return {
      status: 'AMBIGUOUS',
      candidates: matches.map(task => task.title)
    };
  }

  const updateFilter: QueryFilter<ITask> = {
    ...activeFilter,
    _id: matches[0]._id
  };
  const task = await Task.findOneAndUpdate(
    updateFilter,
    { $set: { status } },
    {
      returnDocument: 'after',
      runValidators: true
    }
  );

  return task
    ? { status: 'UPDATED', task }
    : { status: 'NOT_FOUND' };
};
