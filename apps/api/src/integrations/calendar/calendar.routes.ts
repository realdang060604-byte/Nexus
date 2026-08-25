import { Router } from 'express';

import { getCalendarEventsController } from './calendar.controller';

const router = Router();

router.get('/events', getCalendarEventsController);

export default router;
