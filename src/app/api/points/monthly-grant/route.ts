/**
 * 月度积分发放API
 * 
 * POST: 触发月度积分发放给所有用户（定时任务调用）
 * 仅管理员或通过API密钥访问（用于cron任务）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkServiceAccess } from '@/lib/points';

// 会员月度积分配置
const MONTHLY_POINTS_CONFIG = {
  FREE: 0,
  BASIC: 300,
  PRO: 1200,
  BUSINESS: 4000,
} as const;

// 会员短剧配额配置
const SHORT_DRAMA_QUOTA_CONFIG = {
  FREE: 0,
  BASIC: 3,
  PRO: 30,
  BUSINESS: null, // 无限
} as const;

// 发放请求验证schema
const grantSchema = z.object({
  userId: z.string().optional(),
  force: z.boolean().optional().default(false),
});

/**
 * POST /api/points/monthly-grant
 * 触发月度积分发放
 */
export async function POST(request: NextRequest) {
  try {
    // 验证权限：管理员或API密钥
    const session = await getServerSession(authOptions);
    const authHeader = request.headers.get('authorization');
    const cronApiKey = process.env.CRON_API_KEY;

    const isCronCall = cronApiKey && authHeader === `Bearer ${cronApiKey}`;
    const isAdmin = session?.user?.role === 'ADMIN';

    if (!isCronCall && !isAdmin) {
      return NextResponse.json(
        { error: '未授权访问', message: '仅管理员或cron任务可调用此API' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = grantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, force } = validation.data;

    if (userId) {
      // 单个用户发放
      const result = await grantMonthlyPointsToUser(userId, force);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          type: 'single_user',
          userId,
          pointsGranted: result.pointsGranted,
          shortDramaQuotaGranted: result.shortDramaQuotaGranted,
        },
      });
    } else {
      // 批量发放所有会员
      const batchResult = await grantAllMonthlyPoints(force);

      return NextResponse.json({
        success: true,
        message: `成功为 ${batchResult.successCount}/${batchResult.totalUsers} 位会员发放月度积分`,
        data: {
          type: 'batch_all_users',
          totalUsers: batchResult.totalUsers,
          successCount: batchResult.successCount,
          failCount: batchResult.failCount,
          details: batchResult.details.slice(0, 10),
        },
      });
    }
  } catch (error) {
    console.error('月度积分发放失败:', error);
    return NextResponse.json(
      {
        error: '月度积分发放失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 发放月度积分给单个用户
 */
async function grantMonthlyPointsToUser(userId: string, force: boolean = false): Promise<{
  success: boolean;
  pointsGranted: number;
  shortDramaQuotaGranted: number;
  message: string;
}> {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { credits: true },
    });

    if (!user) {
      return {
        success: false,
        pointsGranted: 0,
        shortDramaQuotaGranted: 0,
        message: '用户不存在',
      };
    }

    // FREE用户不发放月度积分
    if (user.plan === 'FREE') {
      return {
        success: true,
        pointsGranted: 0,
        shortDramaQuotaGranted: 0,
        message: 'FREE用户无月度积分',
      };
    }

    const monthlyPoints = MONTHLY_POINTS_CONFIG[user.plan] || 0;
    const shortDramaQuota = SHORT_DRAMA_QUOTA_CONFIG[user.plan];

    if (shortDramaQuota === null) {
      return {
        success: true,
        pointsGranted: 0,
        shortDramaQuotaGranted: 0,
        message: '该会员无月度积分',
      };
    }

    const now = new Date();

    if (!force) {
      // 检查是否需要发放（检查上次发放时间）
      const credit = user.credits;
      if (credit?.lastPointsReset) {
        const lastReset = credit.lastPointsReset;
        const lastResetMonth = lastReset.getMonth();
        const lastResetYear = lastReset.getFullYear();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 如果是同月，不重复发放
        if (lastResetMonth === currentMonth && lastResetYear === currentYear) {
          return {
            success: false,
            pointsGranted: 0,
            shortDramaQuotaGranted: 0,
            message: '本月积分已发放',
          };
        }
      }
    }

    // 获取或创建积分记录
    let credit = user.credits;
    if (!credit) {
      credit = await tx.credit.create({
        data: {
          userId,
          points: 0,
          monthlyPoints: 0,
          shortDramaQuota: 0,
        },
      });
    }

    // 更新月度积分和配额
    const updateData: Record<string, unknown> = {
      monthlyPoints,
      lastPointsReset: now,
    };

    // 如果是 BUSINESS，会员配额是无限的，不需要重置
    if (shortDramaQuota !== null) {
      updateData.shortDramaQuota = shortDramaQuota;
      updateData.shortDramaUsedThisMonth = 0;
    }

    await tx.credit.update({
      where: { userId },
      data: updateData,
    });

    // 记录交易
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: monthlyPoints,
        type: 'BONUS',
        description: `${user.plan}会员月度积分发放`,
      },
    });

    return {
      success: true,
      pointsGranted: monthlyPoints,
      shortDramaQuotaGranted: shortDramaQuota || 0,
      message: `成功发放${user.plan}会员月度积分 ${monthlyPoints} 点`,
    };
  });
}

/**
 * 批量发放所有会员的月度积分
 */
async function grantAllMonthlyPoints(force: boolean = false): Promise<{
  totalUsers: number;
  successCount: number;
  failCount: number;
  details: Array<{ userId: string; plan: string; pointsGranted: number }>;
}> {
  // 获取所有付费会员
  const users = await prisma.user.findMany({
    where: {
      plan: { in: ['BASIC', 'PRO', 'BUSINESS'] },
    },
  });

  const details: Array<{ userId: string; plan: string; pointsGranted: number }> = [];
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    const result = await grantMonthlyPointsToUser(user.id, force);

    if (result.success && result.pointsGranted > 0) {
      successCount++;
      details.push({
        userId: user.id,
        plan: user.plan,
        pointsGranted: result.pointsGranted,
      });
    } else {
      failCount++;
    }
  }

  return {
    totalUsers: users.length,
    successCount,
    failCount,
    details,
  };
}

/**
 * GET /api/points/monthly-grant
 * 获取月度发放统计信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证权限：管理员或API密钥
    const session = await getServerSession(authOptions);
    const authHeader = request.headers.get('authorization');
    const cronApiKey = process.env.CRON_API_KEY;

    const isCronCall = cronApiKey && authHeader === `Bearer ${cronApiKey}`;
    const isAdmin = session?.user?.role === 'ADMIN';

    if (!isCronCall && !isAdmin) {
      return NextResponse.json(
        { error: '未授权访问', message: '仅管理员可查看发放统计' },
        { status: 401 }
      );
    }

    // 获取系统统计
    const [userCount, creditStats, monthlyUsage, userPlanStats] = await Promise.all([
      prisma.user.count(),
      prisma.credit.aggregate({
        _sum: { points: true, monthlyPoints: true },
      }),
      prisma.pointTransaction.aggregate({
        where: { type: 'USAGE', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ['plan'],
        _count: true,
      }),
    ]);

    const planCounts: Record<string, number> = {
      FREE: 0,
      BASIC: 0,
      PRO: 0,
      BUSINESS: 0,
    };

    for (const stat of userPlanStats) {
      planCounts[stat.plan] = stat._count;
    }

    const stats = {
      totalUsers: userCount,
      usersByPlan: planCounts,
      totalPointsInSystem: creditStats._sum.points || 0,
      totalMonthlyPoints: creditStats._sum.monthlyPoints || 0,
      totalPointsConsumedThisMonth: Math.abs(monthlyUsage._sum.amount || 0),
    };

    // 获取本月发放记录
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyGrants = await prisma.pointTransaction.findMany({
      where: {
        type: 'BONUS',
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // 统计各会员等级的发放情况
    const grantStats = await prisma.pointTransaction.aggregate({
      where: {
        type: 'BONUS',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        systemStats: stats,
        monthlyGrantStats: {
          totalGranted: grantStats._sum.amount || 0,
          grantCount: grantStats._count || 0,
          recentGrants: monthlyGrants.slice(0, 20),
        },
        nextGrantDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
  } catch (error) {
    console.error('获取月度发放统计失败:', error);
    return NextResponse.json(
      { error: '获取月度发放统计失败' },
      { status: 500 }
    );
  }
}
