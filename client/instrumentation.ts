import { startNewsScheduler } from '@/app/lib/newsScheduler';

type NewsSchedulerGlobal = typeof globalThis & {
  __worldNewsSchedulerStarted?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (process.env.INTERNAL_SCHEDULER_ENABLED !== 'true') {
    return;
  }

  const runtimeGlobal = globalThis as NewsSchedulerGlobal;
  if (runtimeGlobal.__worldNewsSchedulerStarted) {
    return;
  }

  runtimeGlobal.__worldNewsSchedulerStarted = true;
  startNewsScheduler();
}
