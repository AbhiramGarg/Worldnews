import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function transformArticles(articles: any[]) {
    return articles.map((a: any) => {
        const idVal = a.id ?? a.apiId ?? a.news_id ?? null;
        const publishRaw = a.publish_date ?? a.publishDate ?? a.published_at ?? null;
        let publishDate = new Date();
        if (publishRaw) {
            try {
                const s = String(publishRaw).trim().replace(' ', 'T');
                publishDate = new Date(s);
                if (isNaN(publishDate.getTime())) publishDate = new Date(String(publishRaw));
            } catch (e) {
                publishDate = new Date();
            }
        }

        const category = String(a.category ?? a.cat ?? 'general').toLowerCase();

        return {
            apiId: idVal != null ? BigInt(idVal) : BigInt(0),
            title: a.title ?? '',
            text: a.text ?? '',
            summary: a.summary ?? null,
            url: a.url ?? a.link ?? null,
            image: a.image ?? null,
            video: a.video ?? null,
            publishDate,
            sourceCountry: a.sourceCountry ?? a.source_country ?? (a.source_country ?? '') ?? '',
            language: a.language ?? 'en',
            author: a.author ?? null,
            authors: Array.isArray(a.authors) ? a.authors : (a.authors ? [String(a.authors)] : []),
            category,
        };
    });
}

/**
 * Connects to the PostgreSQL database. Creates the database if it doesn't exist.
 * Returns a PrismaClient instance connected to the database.
 */
export async function connectToDatabase(): Promise<PrismaClient> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse the DATABASE_URL to extract connection details
    const url = new URL(connectionString);
    const host = url.hostname;
    const port = parseInt(url.port) || 5432;
    const user = url.username;
    const password = url.password;
    const dbName = url.pathname.slice(1); // Remove leading '/'

    // Connect to the default 'postgres' database to check/create the target database
    const postgresConnectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
    const pool = new pg.Pool({ connectionString: postgresConnectionString });

    try {
        const client = await pool.connect();
        // Check if the database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
        if (res.rows.length === 0) {
            // Create the database if it doesn't exist
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database '${dbName}' created successfully.`);
        } else {
            console.log(`Database '${dbName}' already exists.`);
        }
        client.release();
    } catch (error) {
        console.error('Error checking or creating database:', error);
        throw error;
    } finally {
        await pool.end();
    }

    // Now connect to the target database using Prisma
    const dbPool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(dbPool);
    const prisma = new PrismaClient({ adapter });

    try {
        await prisma.$connect();
        console.log('Connected to the database successfully.');
        return prisma;
    } catch (error) {
        console.error('Error connecting to the database with Prisma:', error);
        throw error;
    }
}

/**
 * Disconnects from the database.
 * @param prisma - The PrismaClient instance to disconnect.
 */
export async function disconnectFromDatabase(prisma: PrismaClient): Promise<void> {
    try {
        await prisma.$disconnect();
        console.log('Disconnected from the database successfully.');
    } catch (error) {
        console.error('Error disconnecting from the database:', error);
        throw error;
    }
}

/**
 * Delete all existing NewsArticle records and insert new ones in batches.
 * Returns number of rows inserted.
 */
export async function deleteAndInsertNewsArticles(
    prisma: PrismaClient,
    articles: any[],
    batchSize = 500
): Promise<number> {
    try {
        // Delete all existing records (daily refresh behaviour)
        const deleted = await prisma.newsArticle.deleteMany({});
        console.log(`Deleted ${deleted.count} existing articles.`);

        if (!articles || articles.length === 0) {
            console.log('No articles provided to insert.');
            return 0;
        }

        const transformed = transformArticles(articles);

        // Insert in batches to avoid too-large single queries
        let inserted = 0;
        for (let i = 0; i < transformed.length; i += batchSize) {
            const chunk = transformed.slice(i, i + batchSize);
            const res = await prisma.newsArticle.createMany({
                data: chunk,
                skipDuplicates: true,
            });
            inserted += res.count ?? 0;
            console.log(`Inserted chunk ${i / batchSize + 1}: ${res.count} rows.`);
        }

        console.log(`Total inserted: ${inserted}`);
        return inserted;
    } catch (error) {
        console.error('Error in deleteAndInsertNewsArticles:', error);
        throw error;
    }
}

export async function insertNewsArticles(
    prisma: PrismaClient,
    articles: any[],
    batchSize = 500
): Promise<number> {
    try {
        if (!articles || articles.length === 0) {
            console.log('No articles provided to insert.');
            return 0;
        }

        const transformed = transformArticles(articles);

        let inserted = 0;
        for (let i = 0; i < transformed.length; i += batchSize) {
            const chunk = transformed.slice(i, i + batchSize);
            const res = await prisma.newsArticle.createMany({
                data: chunk,
                skipDuplicates: true,
            });
            inserted += res.count ?? 0;
            console.log(`Inserted chunk ${i / batchSize + 1}: ${res.count} rows.`);
        }

        console.log(`Total inserted without delete: ${inserted}`);
        return inserted;
    } catch (error) {
        console.error('Error in insertNewsArticles:', error);
        throw error;
    }
}
