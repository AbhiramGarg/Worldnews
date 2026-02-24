# WorldNews

WorldNews is a Next.js 16 application that fetches news from a third-party API, validates/sanitizes the payload, and stores articles in PostgreSQL via Prisma.

## Current Architecture

- App: `client/` (Next.js App Router, TypeScript)
- Database: external PostgreSQL (not containerized by this repo)
- ORM: Prisma (`@prisma/client` + `@prisma/adapter-pg`)
- Container runtime: client-only via `docker-compose.yml`
- Scheduler options:
  - Internal in-app scheduler (`INTERNAL_SCHEDULER_ENABLED=true` in current compose)
  - External scheduler via Vercel cron (`client/vercel.json`)

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
```

Notes:
- In Docker Desktop on Windows/macOS, use `host.docker.internal` as `<host>` when DB runs on your machine.
- `CRON_SECRET` protects `/api/fetch` when scheduler auth is enabled.

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
- Query:
  - `window=earlybirds`
  - `window=latecomers`
- Default behavior: if `window` is omitted, it runs `earlybirds`.

### Auth for `/api/fetch`

In `client/app/api/fetch/route.ts`, when `CRON_SECRET` is set, requests must include:

```http
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is not set, auth check is bypassed.

### Vercel Cron (External Scheduler)

Configured in `client/vercel.json`:

- `30 1 * * *` → `/api/fetch?window=earlybirds`
- `30 13 * * *` → `/api/fetch?window=latecomers`

Make sure `CRON_SECRET` is also set in Vercel project environment variables.

## Data Flow Summary

1. `/api/fetch` is triggered (manual call, internal scheduler, or Vercel cron).
2. `runNewsSync(window)` fetches third-party news by country group.
3. Payload is validated with `ApiArticleSchema`.
4. Database write strategy:
   - `earlybirds` → delete existing + insert fresh batch
   - `latecomers` → insert-only (dedupe via `skipDuplicates`)

## Important Current Behaviors

- The app attempts to create the target DB if it does not exist (`client/db/postgres_db.ts`).
- DB connectivity errors are runtime errors (for example, wrong host/credentials, DB unavailable), not image build errors.
- `client/vercel.json` is used only by Vercel deployment, not by local Docker Compose.