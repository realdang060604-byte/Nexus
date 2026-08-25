import { listCalendarEvents } from './calendar.service';

const testCalendar =
  async () => {
    try {
      console.log(
        '🔐 Starting Google Calendar OAuth test...'
      );

      const now =
        new Date();

      const sevenDaysLater =
        new Date(
          now.getTime() +
          7 * 24 * 60 * 60 * 1000
        );

      const events = await listCalendarEvents({
        from: now,
        to: sevenDaysLater,
        limit: 10
      });

      console.log('');
      console.log(
        '📅 GOOGLE CALENDAR TEST'
      );
      console.log(
        '======================================'
      );

      if (
        events.length === 0
      ) {
        console.log(
          'Không có sự kiện nào trong 7 ngày tới.'
        );
      } else {
        events.forEach(
          (
            event,
            index
          ) => {
            const start =
              event.start?.dateTime ||
              event.start?.date ||
              'Unknown';

            console.log(
              `${index + 1}. ${event.summary || 'Không có tiêu đề'}`
            );

            console.log(
              `   ${start}`
            );
          }
        );
      }

      console.log(
        '======================================'
      );

      console.log(
        `✅ Found ${events.length} calendar event(s)`
      );

    } catch (error) {
      console.error(
        '❌ Google Calendar test failed:',
        error
      );

      process.exit(1);
    }
  };

testCalendar();
