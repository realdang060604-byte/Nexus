import { google } from 'googleapis';

import { authorizeCalendar } from './calendar.auth';

const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  timeZone?: string;
}

export interface ListCalendarEventsInput {
  from?: Date;
  to?: Date;
  limit?: number;
}

const getCalendarClient = async () => {
  const auth = await authorizeCalendar();

  return google.calendar({
    version: 'v3',
    auth
  });
};

const getCalendarId = (): string => (
  process.env.GOOGLE_CALENDAR_ID || 'primary'
);

export const createCalendarEvent = async (
  input: CreateCalendarEventInput
) => {
  const title = input.title.trim();

  if (!title) {
    throw new Error('Calendar event title is required');
  }

  if (
    Number.isNaN(input.startAt.getTime()) ||
    Number.isNaN(input.endAt.getTime())
  ) {
    throw new Error('Calendar event date is invalid');
  }

  if (input.endAt <= input.startAt) {
    throw new Error('Calendar event must end after it starts');
  }

  const calendar = await getCalendarClient();
  const timeZone = input.timeZone ||
    process.env.NEXUS_TIME_ZONE ||
    DEFAULT_TIME_ZONE;

  const response = await calendar.events.insert({
    calendarId: getCalendarId(),
    requestBody: {
      summary: title,
      description: input.description?.trim() || undefined,
      location: input.location?.trim() || undefined,
      start: {
        dateTime: input.startAt.toISOString(),
        timeZone
      },
      end: {
        dateTime: input.endAt.toISOString(),
        timeZone
      }
    }
  });

  return response.data;
};

export const listCalendarEvents = async (
  input: ListCalendarEventsInput = {}
) => {
  const from = input.from || new Date();
  const to = input.to || new Date(
    from.getTime() + 7 * 24 * 60 * 60 * 1000
  );
  const limit = Number.isFinite(input.limit) && input.limit! > 0
    ? Math.min(Math.floor(input.limit!), 50)
    : 10;

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    to <= from
  ) {
    throw new Error('Calendar event range is invalid');
  }

  const calendar = await getCalendarClient();
  const response = await calendar.events.list({
    calendarId: getCalendarId(),
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: limit
  });

  return response.data.items || [];
};
