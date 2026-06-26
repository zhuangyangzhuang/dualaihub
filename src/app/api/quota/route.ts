import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Plan video quotas
const VIDEO_QUOTAS: Record<string, number | null> = {
  FREE: 0,
  BASIC: 3,
  PRO: 30,
  BUSINESS: null, // Unlimited
};

// Points cost per service type
const POINTS_COST: Record<string, number> = {
  text: 1,
  code: 1,
  image: 1,
  video: 5,
  music: 3,
};

// GET: Check user's quota status (credits, points, video usage)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with credits and video usage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        credits: true,
        videoUsages: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const credits = user.credits?.amount ?? 0;
    const points = user.credits?.points ?? 0;
    const dailyUsed = user.credits?.dailyUsed ?? 0;
    const lastReset = user.credits?.lastReset ?? new Date();
    const videoUsedThisMonth = user.videoUsages[0]?.usageCount ?? 0;
    const lastVideoReset = user.credits?.lastVideoReset ?? new Date();

    // Check if video quota needs monthly reset
    const now = new Date();
    const videoResetDate = new Date(lastVideoReset);
    const shouldResetVideo = 
      videoResetDate.getMonth() !== now.getMonth() || 
      videoResetDate.getFullYear() !== now.getFullYear();

    const effectiveVideoUsed = shouldResetVideo ? 0 : videoUsedThisMonth;
    const videoQuota = VIDEO_QUOTAS[user.plan] ?? 0;

    return NextResponse.json({
      credits,
      points,
      dailyUsed,
      lastReset,
      videoUsage: effectiveVideoUsed,
      videoQuota,
      videoReset: shouldResetVideo ? now : lastVideoReset,
      plan: user.plan,
      dailyQuota: getDailyQuota(user.plan),
      resetIn: getResetTimeInMs(lastReset),
    });
  } catch (error) {
    console.error('Quota GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quota data' },
      { status: 500 }
    );
  }
}

// POST: Deduct quota/points for a request
const deductSchema = z.object({
  serviceType: z.enum(['text', 'code', 'image', 'video', 'music']),
  creditsToUse: z.number().optional(),
  usePointsInstead: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = deductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceType, creditsToUse, usePointsInstead } = validation.data;
    const userId = session.user.id;

    // Get user with credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        credits: true,
        videoUsages: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const credits = user.credits;
    const points = credits?.points ?? 0;
    const videoQuota = VIDEO_QUOTAS[user.plan] ?? 0;
    const now = new Date();

    // Check video quota for video service
    if (serviceType === 'video') {
      if (user.plan === 'FREE') {
        return NextResponse.json(
          { error: 'Video generation not available for FREE users' },
          { status: 403 }
        );
      }

      const videoUsage = user.videoUsages[0]?.usageCount ?? 0;
      if (videoQuota !== null && videoUsage >= videoQuota) {
        return NextResponse.json(
          { error: 'Video quota exhausted', quota: videoQuota, used: videoUsage },
          { status: 403 }
        );
      }
    }

    // Determine payment method
    if (usePointsInstead) {
      const pointsRequired = POINTS_COST[serviceType];
      if (points < pointsRequired) {
        return NextResponse.json(
          { error: 'Insufficient points', required: pointsRequired, available: points },
          { status: 403 }
        );
      }

      // Deduct points
      await prisma.credit.update({
        where: { userId },
        data: {
          points: { decrement: pointsRequired },
        },
      });

      // Record points transaction
      await prisma.pointTransaction.create({
        data: {
          userId,
          amount: -pointsRequired,
          type: 'USAGE',
          description: `Used ${pointsRequired} points for ${serviceType} generation`,
        },
      });

      // If video, increment video usage
      if (serviceType === 'video') {
        await prisma.userVideoUsage.upsert({
          where: {
            userId_month_year: {
              userId,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            },
          },
          update: {
            usageCount: { increment: 1 },
          },
          create: {
            userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            usageCount: 1,
          },
        });
      }

      return NextResponse.json({
        success: true,
        paymentMethod: 'points',
        pointsDeducted: pointsRequired,
        remainingPoints: points - pointsRequired,
      });
    }

    // Use credits
    const creditsRequired = creditsToUse ?? POINTS_COST[serviceType];
    if ((credits?.amount ?? 0) < creditsRequired) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsRequired, available: credits?.amount ?? 0 },
        { status: 403 }
      );
    }

    // Deduct credits
    await prisma.credit.update({
      where: { userId },
      data: {
        amount: { decrement: creditsRequired },
        dailyUsed: { increment: creditsRequired },
      },
    });

    // If video, increment video usage
    if (serviceType === 'video') {
      await prisma.userVideoUsage.upsert({
        where: {
          userId_month_year: {
            userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          usageCount: { increment: 1 },
        },
        create: {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          usageCount: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      paymentMethod: 'credits',
      creditsDeducted: creditsRequired,
      remainingCredits: (credits?.amount ?? 0) - creditsRequired,
    });
  } catch (error) {
    console.error('Quota POST error:', error);
    return NextResponse.json(
      { error: 'Failed to deduct quota' },
      { status: 500 }
    );
  }
}

function getDailyQuota(plan: string): number {
  const quotas: Record<string, number> = {
    FREE: 100,
    BASIC: 1000,
    PRO: 5000,
    BUSINESS: 50000,
  };
  return quotas[plan] ?? 100;
}

function getResetTimeInMs(lastReset: Date): number {
  const now = new Date();
  const tomorrow = new Date(lastReset);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}
