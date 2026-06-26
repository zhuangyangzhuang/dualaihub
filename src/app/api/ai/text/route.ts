import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiScheduler } from '@/lib/ai/scheduler';

const textGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  systemPrompt: z.string().optional(),
});

// Credits cost per text generation
const TEXT_CREDITS_COST = 1;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = textGenerationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, model, temperature, maxTokens, systemPrompt } = validation.data;

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

    // Calculate daily quota based on plan
    const dailyQuota = getDailyQuota(session.user.plan);
    const remainingDaily = dailyQuota - creditRecord.dailyUsed;

    if (remainingDaily < TEXT_CREDITS_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient daily quota',
          remaining: remainingDaily,
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
        temperature,
        maxTokens,
        options: systemPrompt ? { systemPrompt } : undefined,
      },
      'text'
    );

    if (!result.success) {
      // Log failed attempt
      await prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'text',
          model: result.provider,
          prompt,
          creditsUsed: 0,
          status: 'failed',
        },
      });

      return NextResponse.json(
        { error: result.error || 'AI generation failed' },
        { status: 500 }
      );
    }

    // Deduct credits and update daily usage
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId: session.user.id },
        data: {
          dailyUsed: { increment: TEXT_CREDITS_COST },
        },
      }),
      prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'text',
          model: result.provider,
          prompt,
          result: result.data
            ? (typeof result.data === 'object' && 'content' in result.data
              ? result.data.content as string
              : JSON.stringify(result.data))
            : 'No response',
          creditsUsed: TEXT_CREDITS_COST,
          status: 'completed',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      creditsUsed: TEXT_CREDITS_COST,
      remainingDaily: remainingDaily - TEXT_CREDITS_COST,
    });
  } catch (error) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during text generation' },
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
