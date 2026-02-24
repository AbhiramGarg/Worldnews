// lib/prisma.ts

import { connectToDatabase } from '@/db/postgres_db';
import type { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (!prismaInstance) {
    prismaInstance = await connectToDatabase();
  }
  return prismaInstance;
}