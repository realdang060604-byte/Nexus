import {
  createTask,
  getTasks,
  updateTaskStatusByTitle
} from '../modules/tasks/task.service';

import {
  NexusTool
} from './tool.types';

/* ==========================================
   TYPES
========================================== */

interface CreateTaskInput {
  title: string;

  description?: string;

  dueAt?: string;

  priority?:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';
}

/* ==========================================
   CREATE TASK
========================================== */

export const createTaskTool:
NexusTool<CreateTaskInput> = {
  name:
    'CREATE_TASK',

  description:
    'Create a new task.',

  async execute(input, context) {
    if (!input.title) {
      throw new Error(
        'CREATE_TASK requires title'
      );
    }

    let dueAt:
      Date | undefined;

    if (input.dueAt) {
      const parsedDate =
        new Date(
          input.dueAt
        );

      if (
        !Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        dueAt =
          parsedDate;
      }
    }

    const task =
      await createTask({
        userId:
          context.userId,
        title:
          input.title,

        description:
          input.description ||
          '',

        priority:
          input.priority ||
          'MEDIUM',

        dueAt,

        source:
          'AI'
      });

    return {
      action:
        'CREATE_TASK',

      message:
        `Đã tạo công việc: "${task.title}"`,

      data:
        task
    };
  }
};

/* ==========================================
   LIST TASKS
========================================== */

export const listTasksTool:
NexusTool<Record<string, never>> = {
  name:
    'LIST_TASKS',

  description:
    'Get active tasks.',

  async execute(_input, context) {
    const tasks =
      await getTasks(
        context.userId
      );

    const activeTasks =
      tasks.filter(
        task =>
          task.status !==
            'DONE' &&
          task.status !==
            'CANCELLED'
      );

    return {
      action:
        'LIST_TASKS',

      message:
        activeTasks.length === 0
          ? 'Bạn hiện không còn công việc nào.'
          : `Bạn còn ${activeTasks.length} công việc.`,

      data:
        activeTasks
    };
  }
};

/* ==========================================
   COMPLETE / CANCEL TASK
========================================== */

const updateTaskFromNaturalTitle = async (
  title: string | undefined,
  userId: string,
  status: 'DONE' | 'CANCELLED'
) => {
  if (!title?.trim()) {
    return {
      success: false,
      action: status === 'DONE' ? 'COMPLETE_TASK' : 'CANCEL_TASK',
      message: 'Bạn cần cho biết tên công việc muốn cập nhật.'
    };
  }

  const result = await updateTaskStatusByTitle(
    userId,
    title,
    status
  );

  if (result.status === 'NOT_FOUND') {
    return {
      success: false,
      action: status === 'DONE' ? 'COMPLETE_TASK' : 'CANCEL_TASK',
      message: `Không tìm thấy công việc đang mở khớp với “${title}”.`
    };
  }

  if (result.status === 'AMBIGUOUS') {
    return {
      success: false,
      action: status === 'DONE' ? 'COMPLETE_TASK' : 'CANCEL_TASK',
      message: [
        'Có nhiều công việc phù hợp. Hãy nói rõ hơn:',
        ...(result.candidates || []).map(item => `• ${item}`)
      ].join('\n'),
      data: result.candidates
    };
  }

  return {
    success: true,
    action: status === 'DONE' ? 'COMPLETE_TASK' : 'CANCEL_TASK',
    message: status === 'DONE'
      ? `Đã hoàn thành công việc “${result.task?.title}”.`
      : `Đã hủy công việc “${result.task?.title}”.`,
    data: result.task
  };
};

export const completeTaskTool:
NexusTool<{ title?: string }> = {
  name: 'COMPLETE_TASK',
  description: 'Mark an active task as completed.',
  execute: (input, context) => updateTaskFromNaturalTitle(
    input.title,
    context.userId,
    'DONE'
  )
};

export const cancelTaskTool:
NexusTool<{ title?: string }> = {
  name: 'CANCEL_TASK',
  description: 'Cancel an active task.',
  execute: (input, context) => updateTaskFromNaturalTitle(
    input.title,
    context.userId,
    'CANCELLED'
  )
};
