import { Request, Response } from 'express';

import { listCalendarEvents } from './calendar.service';

const parseOptionalDate = (
  value: unknown,
  field: string
): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} must be an ISO date`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be an ISO date`);
  }

  return date;
};

export const getCalendarEventsController = async (
  req: Request,
  res: Response
) => {
  try {
    const from = parseOptionalDate(req.query.from, 'from');
    const to = parseOptionalDate(req.query.to, 'to');
    const rawLimit = req.query.limit;
    const limit = typeof rawLimit === 'string'
      ? Number(rawLimit)
      : undefined;

    if (
      limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 50)
    ) {
      res.status(400).json({
        success: false,
        message: 'limit must be an integer from 1 to 50'
      });
      return;
    }

    const events = await listCalendarEvents({
      from,
      to,
      limit
    });

    res.status(200).json({
      success: true,
      data: events.map(event => ({
        id: event.id,
        title: event.summary || 'Không có tiêu đề',
        description: event.description,
        location: event.location,
        startAt: event.start?.dateTime || event.start?.date,
        endAt: event.end?.dateTime || event.end?.date,
        htmlLink: event.htmlLink,
        status: event.status
      }))
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Failed to load Calendar events';
    const validationError = message.includes('must be an ISO date');

    console.error('Calendar events error:', error);
    res.status(validationError ? 400 : 502).json({
      success: false,
      message
    });
  }
};
