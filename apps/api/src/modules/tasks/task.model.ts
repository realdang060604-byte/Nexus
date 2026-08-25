import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export interface ITask extends Document {
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date;
  reminderSentAt?: Date | null;
  reminderClaimedAt?: Date | null;
  tags: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
    {
      userId: {
        type: String,
        required: true,
        trim: true,
        index: true
      },

      title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
      default: 'TODO'
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },

      dueAt: {
        type: Date,
        default: null
      },

      reminderSentAt: {
        type: Date,
        default: null
      },

      reminderClaimedAt: {
        type: Date,
        default: null
      },

    tags: {
      type: [String],
      default: []
    },

    source: {
      type: String,
      default: 'WEB'
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1
});

taskSchema.index({
  status: 1,
  reminderSentAt: 1,
  reminderClaimedAt: 1,
  dueAt: 1
});

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
