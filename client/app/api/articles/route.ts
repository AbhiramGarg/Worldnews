import { NextResponse } from 'next/server';
import { getPrisma } from '../../lib/prisma';

type CachedArticles = {
  expiresAt: number;
  articles: any[];
};

const ARTICLES_CACHE_TTL_MS = 30_000;
const articlesCache = new Map<string, CachedArticles>();

export async function GET(req: Request) {
  let prisma = null;
  try {
    const url = new URL(req.url);
    const countryParam = url.searchParams.get('country');
    const categoryParam = url.searchParams.get('category');

    const where: any = {};

    if (countryParam && countryParam.toLowerCase() !== 'all') {
      const c = countryParam.toLowerCase();
      where.sourceCountry = c;
    }

    if (categoryParam && categoryParam.toLowerCase() !== 'all') {
      where.category = categoryParam.toLowerCase();
    }

    const cacheKey = `${countryParam ?? 'all'}|${categoryParam ?? 'all'}`;
    const now = Date.now();
    const cached = articlesCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(
        { articles: cached.articles },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
      );
    }

    prisma = await getPrisma();
    const articlesRaw = await prisma.newsArticle.findMany({
      where,
      orderBy: { publishDate: 'desc' },
      select: {
        apiId: true,
        title: true,
        summary: true,
        text: true,
        image: true,
        url: true,
        publishDate: true,
      },
      take: 200,
    });

    // Convert BigInt to string for JSON serialization
    const articles = articlesRaw.map(article => ({
      ...article,
      apiId: article.apiId.toString(),
    }));

    articlesCache.set(cacheKey, {
      expiresAt: now + ARTICLES_CACHE_TTL_MS,
      articles,
    });

    return NextResponse.json(
      { articles },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  } catch (err) {
    console.error('articles route error', err);
    return NextResponse.json({ articles: [], error: 'server error' }, { status: 500 });
  }
}
