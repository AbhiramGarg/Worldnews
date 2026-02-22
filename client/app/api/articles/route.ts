import { NextResponse } from 'next/server';
import { getPrisma } from '../../lib/prisma';

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

    return NextResponse.json({ articles });
  } catch (err) {
    console.error('articles route error', err);
    return NextResponse.json({ articles: [], error: 'server error' }, { status: 500 });
  }
}
