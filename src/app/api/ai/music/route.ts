import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiScheduler } from '@/lib/ai/scheduler';

const musicGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000),
  duration: z.number().min(5).max(300).optional(),
  style: z.string().optional(),
  model: z.string().optional(),
});

// Credits cost per music generation (per 30 seconds)
const MUSIC_CREDITS_COST_PER_30S = 5;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = musicGenerationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, duration = 30, style, model } = validation.data;

    // Calculate credits based on duration
    const creditsCost = Math.ceil(duration / 30) * MUSIC_CREDITS_COST_PER_30S;

    // Check user quota
    const creditRecord = await prisma.credit.findUnique({
      where: { userId: session.user.id },
    });

    if (!creditRecord) {
      return NextResponse.json(
        { error: 'Credit record not found' },
        { status: 404 }
      );
    }

    const dailyQuota = getDailyQuota(session.user.plan);
    const remainingDaily = dailyQuota - creditRecord.dailyUsed;

    if (remainingDaily < creditsCost) {
      return NextResponse.json(
        {
          error: 'Insufficient daily quota',
          remaining: remainingDaily,
          required: creditsCost,
          resetAt: creditRecord.lastReset,
        },
        { status: 402 }
      );
    }

    // Process AI request
    const result = await aiScheduler.process(
      {
        prompt,
        model,
        options: { duration, style },
      },
      'music'
    );

    if (!result.success) {
      await prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'music',
          model: result.provider,
          prompt,
          creditsUsed: 0,
          status: 'failed',
        },
      });

      return NextResponse.json(
        { error: result.error || 'Music generation failed' },
        { status: 500 }
      );
    }

    // Deduct credits and log
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId: session.user.id },
        data: {
          dailyUsed: { increment: creditsCost },
        },
      }),
      prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'music',
          model: result.provider,
          prompt,
          result: JSON.stringify(result.data),
          creditsUsed: creditsCost,
          status: 'completed',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      duration,
      creditsUsed: creditsCost,
      remainingDaily: remainingDaily - creditsCost,
    });
  } catch (error) {
    console.error('Music generation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during music generation' },
      { status: 500 }
    );
  }
}

function getDailyQuota(plan: string): number {
  const quotas: Record<string, number> = {
    FREE: 50,
    BASIC: 500,
    PRO: 2000,
    BUSINESS: 999999,
  };
  return quotas[plan] || 50;
}
