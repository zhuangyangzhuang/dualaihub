import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiScheduler } from '@/lib/ai/scheduler';

const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000),
  style: z.enum(['realistic', 'artistic', 'anime', 'abstract', 'photo']).optional(),
  size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
  model: z.string().optional(),
});

// Credits cost per image generation
const IMAGE_CREDITS_COST = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = imageGenerationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, style, size, model } = validation.data;

    // Build prompt with style if specified
    let fullPrompt = prompt;
    if (style) {
      fullPrompt = `${style} ${prompt}`;
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

    if (remainingDaily < IMAGE_CREDITS_COST) {
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
        options: { size },
      },
      'image'
    );

    if (!result.success) {
      await prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'image',
          model: result.provider,
          prompt,
          creditsUsed: 0,
          status: 'failed',
        },
      });

      return NextResponse.json(
        { error: result.error || 'Image generation failed' },
        { status: 500 }
      );
    }

    // Deduct credits and log
    await prisma.$transaction([
      prisma.credit.update({
        where: { userId: session.user.id },
        data: {
          dailyUsed: { increment: IMAGE_CREDITS_COST },
        },
      }),
      prisma.aIHistory.create({
        data: {
          userId: session.user.id,
          serviceType: 'image',
          model: result.provider,
          prompt,
          result: result.data
            ? (typeof result.data === 'object' && 'imageUrls' in result.data
              ? JSON.stringify(result.data.imageUrls)
              : JSON.stringify(result.data))
            : 'No response',
          creditsUsed: IMAGE_CREDITS_COST,
          status: 'completed',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      style,
      creditsUsed: IMAGE_CREDITS_COST,
      remainingDaily: remainingDaily - IMAGE_CREDITS_COST,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during image generation' },
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
