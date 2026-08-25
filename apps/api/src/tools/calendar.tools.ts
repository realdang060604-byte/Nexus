import {
  createCalendarEvent,
  listCalendarEvents
} from '../integrations/calendar/calendar.service';
import { NexusTool } from './tool.types';

interface CreateCalendarEventToolInput {
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
}

interface ListCalendarEventsToolInput {
  startAt?: string;
  endAt?: string;
}

const parseDate = (
  value: string | undefined,
  field: string
): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid ISO date`);
  }

  return date;
};

export const createCalendarEventTool:
NexusTool<CreateCalendarEventToolInput> = {
  name: 'CREATE_CALENDAR_EVENT',
  description: 'Create an event in Google Calendar.',

  async execute(input) {
    const title = input.title?.trim();
    const startAt = parseDate(input.startAt, 'startAt');

    if (!title) {
      throw new Error('CREATE_CALENDAR_EVENT requires title');
    }

    if (!startAt) {
      throw new Error('CREATE_CALENDAR_EVENT requires startAt');
    }

    const endAt = parseDate(input.endAt, 'endAt') ||
      new Date(startAt.getTime() + 60 * 60 * 1000);

    const event = await createCalendarEvent({
      title,
      description: input.description,
      startAt,
      endAt,
      location: input.location
    });

    return {
      action: 'CREATE_CALENDAR_EVENT',
      message: `Đã thêm sự kiện "${title}" vào Google Calendar.`,
      data: event
    };
  }
};

export const listCalendarEventsTool:
NexusTool<ListCalendarEventsToolInput> = {
  name: 'LIST_CALENDAR_EVENTS',
  description: 'List upcoming events from Google Calendar.',

  async execute(input) {
    const events = await listCalendarEvents({
      from: parseDate(input.startAt, 'startAt'),
      to: parseDate(input.endAt, 'endAt')
    });

    return {
      action: 'LIST_CALENDAR_EVENTS',
      message: events.length === 0
        ? 'Không có sự kiện nào trong khoảng thời gian này.'
        : `Bạn có ${events.length} sự kiện sắp tới.`,
      data: events
    };
  }
};
