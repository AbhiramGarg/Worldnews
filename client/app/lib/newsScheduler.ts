import { runNewsSync } from '@/app/lib/newsSync';

const DAY_MS = 24 * 60 * 60 * 1000;

function getDelayUntilNextUtcTime(targetHourUtc: number, targetMinuteUtc: number): number {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    targetHourUtc,
    targetMinuteUtc,
    0,
    0,
  ));

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function scheduleDailyJob(
  label: string,
  targetHourUtc: number,
  targetMinuteUtc: number,
  run: () => Promise<void>,
) {
  const firstDelay = getDelayUntilNextUtcTime(targetHourUtc, targetMinuteUtc);
  console.log(`[scheduler] ${label} first run in ${Math.round(firstDelay / 1000)}s`);

  setTimeout(async () => {
    await run();

    setInterval(async () => {
      await run();
    }, DAY_MS);
  }, firstDelay);
}

export function startNewsScheduler() {
  console.log('[scheduler] Starting IST schedule: 07:00 earlybirds, 19:00 latecomers');

  let morningRunning = false;
  let eveningRunning = false;

  scheduleDailyJob('07:00 IST earlybirds', 1, 30, async () => {
    if (morningRunning) {
      console.log('[scheduler] Skipping earlybirds run: previous run still active');
      return;
    }

    morningRunning = true;
    try {
      const result = await runNewsSync('earlybirds');
      console.log(`[scheduler] Earlybirds complete: count=${result.count}, saved=${result.saved}, mode=${result.dbMode}`);
    } catch (err) {
      console.error('[scheduler] Earlybirds run failed', err);
    } finally {
      morningRunning = false;
    }
  });

  scheduleDailyJob('19:00 IST latecomers', 13, 30, async () => {
    if (eveningRunning) {
      console.log('[scheduler] Skipping latecomers run: previous run still active');
      return;
    }

    eveningRunning = true;
    try {
      const result = await runNewsSync('latecomers');
      console.log(`[scheduler] Latecomers complete: count=${result.count}, saved=${result.saved}, mode=${result.dbMode}`);
    } catch (err) {
      console.error('[scheduler] Latecomers run failed', err);
    } finally {
      eveningRunning = false;
    }
  });
}
