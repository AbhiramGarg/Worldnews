-- CreateTable
CREATE TABLE "news_article" (
    "apiId" BIGINT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "text" TEXT NOT NULL,
    "summary" TEXT,
    "url" VARCHAR(1000),
    "image" VARCHAR(1000),
    "video" VARCHAR(1000),
    "publish_date" TIMESTAMP(3) NOT NULL,
    "source_country" VARCHAR(3) NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "author" TEXT,
    "authors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_article_pkey" PRIMARY KEY ("apiId")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_article_apiId_key" ON "news_article"("apiId");
