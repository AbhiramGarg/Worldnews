# WorldNews Client

This is the Next.js application for WorldNews.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Required Environment Variables

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
WORLD_NEWS_API_KEY=<world_news_api_key>
```

## Optional Environment Variables

```env
CRON_SECRET=<strong_random_secret>
INTERNAL_SCHEDULER_ENABLED=false
SYNC_COUNTRY_DELAY_MS=1000
SYNC_MAX_429_RETRIES=3
SYNC_429_BACKOFF_BASE_MS=3000
SYNC_429_BACKOFF_MAX_MS=45000
```

## Scheduler Modes

- Internal scheduler: set `INTERNAL_SCHEDULER_ENABLED=true`
- External scheduler: call `/api/fetch?window=earlybirds|latecomers` (or `/api/trigger-sync`) and pass `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is configured

For full architecture and operational docs, see the workspace root `README.md`.
