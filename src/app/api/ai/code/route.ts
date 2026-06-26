import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiScheduler } from '@/lib/ai/scheduler';

const codeGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000),
  language: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
});

// Credits cost per code generation
const CODE_CREDITS_COST = 2;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = codeGenerationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, language, model, temperature, maxTokens } = validation.data;

    // Build the prompt with language context
    let fullPrompt = prompt;
    if (language) {
      fullPrompt = `Write ${language} code for the following:\n\n${prompt}`;
    }

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

    if (remainingDaily < CODE_CREDITS_COST) {
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
        prompt: fullPrompt,
        model,
        temperature: temperature ?? 0.3,
        maxTokens,
      },
      'code'
    );

    if (!result.success) {
      await prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'code',
          model: result.provider,
          prompt,
          creditsUsed: 0,
          status: 'failed',
        },
      });

      return NextResponse.json(
        { error: result.error || 'Code generation failed' },
        { status: 500 }
      );
    }

    // Deduct credits and log
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId: session.user.id },
        data: {
          dailyUsed: { increment: CODE_CREDITS_COST },
        },
      }),
      prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'code',
          model: result.provider,
          prompt,
          result: result.data 
            ? (typeof result.data === 'object' && 'content' in result.data
              ? result.data.content as string
              : JSON.stringify(result.data))
            : 'No response',
          creditsUsed: CODE_CREDITS_COST,
          status: 'completed',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      language,
      creditsUsed: CODE_CREDITS_COST,
      remainingDaily: remainingDaily - CODE_CREDITS_COST,
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during code generation' },
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
