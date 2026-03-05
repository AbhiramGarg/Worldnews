# WorldNews

WorldNews is a Next.js 16 application that fetches news from a third-party API, validates/sanitizes the payload, and stores articles in PostgreSQL via Prisma.

## Current Architecture

- App: `client/` (Next.js App Router, TypeScript)
- Database: external PostgreSQL (not containerized by this repo)
- ORM: Prisma (`@prisma/client` + `@prisma/adapter-pg`)
- Container runtime: client-only via `docker-compose.yml`
- Scheduler options:
  - Internal in-app scheduler (`INTERNAL_SCHEDULER_ENABLED=true`)
  - External scheduler (any platform cron/job runner) calling API routes

## Environment Variables

For Docker Compose (`docker-compose.yml`), define these in root `.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
WORLD_NEWS_API_KEY=<world_news_api_key>
```

For local Next.js runtime (`client/.env`), define:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
WORLD_NEWS_API_KEY=<world_news_api_key>
CRON_SECRET=<strong_random_secret>
INTERNAL_SCHEDULER_ENABLED=false
SYNC_COUNTRY_DELAY_MS=1000
SYNC_MAX_429_RETRIES=3
SYNC_429_BACKOFF_BASE_MS=3000
SYNC_429_BACKOFF_MAX_MS=45000
```

Notes:
- In Docker Desktop on Windows/macOS, use `host.docker.internal` as `<host>` when DB runs on your machine.
- `CRON_SECRET` protects scheduler-facing endpoints (`/api/fetch`, `/api/trigger-sync`) when set.
- `SYNC_COUNTRY_DELAY_MS` applies when a single sync run processes multiple countries sequentially.
- `SYNC_MAX_429_RETRIES` and backoff settings control how aggressively `429` responses are retried.

## Run with Docker (Client-Only, Stateless)

Prerequisite: Docker Desktop must be running.

```bash
docker compose up -d --build client
```

Useful commands:

```bash
docker logs -f worldnews_client
docker compose down
```

App URL: `http://localhost:3000`

## Run Locally (Node.js)

```bash
cd client
npm install
npx prisma generate
npm run dev
```

If schema setup is needed:

```bash
npx prisma db push
# or
npx prisma migrate deploy
```

## Scheduler & API Endpoints

### Fetch Sync Endpoint

- Route: `/api/fetch`
- Methods: `GET` and `POST`
- Query/body:
  - `window=earlybirds`
  - `window=latecomers`
  - optional `countries` (comma-separated query or array in JSON body)
  - optional `replaceCountries` and `resetBeforeInsert`
- Default behavior: if `window` is omitted, it runs `earlybirds`.

### Trigger Sync Endpoint

- Route: `/api/trigger-sync`
- Methods: `GET` and `POST`
- Purpose: provider-neutral trigger endpoint for orchestrated sync calls
- Query/body:
  - `window=earlybirds|latecomers`
  - optional `countries`
  - optional `replaceCountries` and `resetBeforeInsert`
- Defaults when options are omitted:
  - `replaceCountries=true`
  - `resetBeforeInsert=false`

### Manual Missing-Country Recovery Endpoint

- Route: `/api/retry-missing-countries`
- Methods: `GET` and `POST`
- Query/body:
  - `window=earlybirds|latecomers`
  - optional `countries` (comma-separated in query or array in JSON body)
  - optional `onlyReport=true` (GET only) to list missing countries without fetching

Examples:

```bash
# Report-only (no fetch)
curl "http://localhost:3000/api/retry-missing-countries?window=earlybirds&onlyReport=true"

# Retry only countries currently missing in DB
curl "http://localhost:3000/api/retry-missing-countries?window=earlybirds"

# Retry only a specific subset manually
curl "http://localhost:3000/api/retry-missing-countries?window=earlybirds&countries=gb,fr,de"
```

### Auth for Scheduler Endpoints

When `CRON_SECRET` is set, scheduler requests must include:

```http
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is not set, auth check is bypassed.

### External Scheduler Example

You can use any scheduler (Cloud Scheduler, cron, CI/CD scheduled jobs, etc.) to hit:

- `/api/fetch?window=earlybirds`
- `/api/fetch?window=latecomers`

Example:

```bash
curl -X POST "https://<your-domain>/api/fetch?window=earlybirds" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## Data Flow Summary

1. `/api/fetch` or `/api/trigger-sync` is triggered (manual call, internal scheduler, or external scheduler).
2. `runNewsSync(window)` fetches third-party news by country group.
3. Payload is validated with `ApiArticleSchema`.
4. Database write strategy:
   - `/api/fetch` defaults:
     - `earlybirds` → delete existing + insert fresh batch
     - `latecomers` → insert-only (dedupe via `skipDuplicates`)
   - `/api/trigger-sync` defaults:
     - replace-countries mode (`replaceCountries=true`, `resetBeforeInsert=false`)

## Important Current Behaviors

- The app attempts to create the target DB if it does not exist (`client/db/postgres_db.ts`).
- DB connectivity errors are runtime errors (for example, wrong host/credentials, DB unavailable), not image build errors.
- The `main` branch intentionally contains no platform-specific deployment integration.