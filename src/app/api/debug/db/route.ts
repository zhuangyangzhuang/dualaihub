import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const creditCount = await prisma.credit.count();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      creditCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextauthUrl: !!process.env.NEXTAUTH_URL,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      },
      { status: 500 }
    );
  }
}
