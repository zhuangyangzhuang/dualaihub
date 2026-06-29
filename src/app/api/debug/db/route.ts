import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  const testUrls = [
    { name: 'DATABASE_URL (from env)', url: process.env.DATABASE_URL },
    { name: 'DIRECT_URL (from env)', url: process.env.DIRECT_URL },
  ];

  for (const test of testUrls) {
    if (!test.url) {
      results[test.name] = { status: 'not_configured' };
      continue;
    }
    try {
      const maskedUrl = test.url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
      const prisma = new PrismaClient({
        datasources: { db: { url: test.url } },
      });
      const userCount = await prisma.user.count();
      await prisma.$disconnect();
      results[test.name] = {
        status: 'connected',
        userCount,
        url: maskedUrl,
      };
    } catch (error: any) {
      const maskedUrl = test.url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
      results[test.name] = {
        status: 'failed',
        error: error?.message || 'Unknown error',
        url: maskedUrl,
      };
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextauthUrl: !!process.env.NEXTAUTH_URL,
    },
    tests: results,
  });
}
