CREATE TABLE "country_sync_status" (
  "id" BIGSERIAL PRIMARY KEY,
  "window" VARCHAR(20) NOT NULL,
  "country" VARCHAR(3) NOT NULL,
  "last_run_id" VARCHAR(80),
  "last_attempt_at" TIMESTAMP(3) NOT NULL,
  "last_success_at" TIMESTAMP(3),
  "last_outcome" VARCHAR(40) NOT NULL,
  "last_http_status" INTEGER,
  "fetched_count" INTEGER NOT NULL DEFAULT 0,
  "sanitized_count" INTEGER NOT NULL DEFAULT 0,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "country_sync_status_window_country_key"
  ON "country_sync_status" ("window", "country");