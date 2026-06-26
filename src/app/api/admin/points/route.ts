import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';
import {
  ServiceType,
  PRICING_CONFIG,
  MODEL_MAPPINGS,
  validateMultiplierChange,
  LOCKED_MULTIPLIERS,
} from '@/lib/points/pricing';
import { QUOTA_CONFIGS } from '@/lib/points/quota';
import { grantAllMonthlyPoints, getSystemPointsStats } from '@/lib/points/core';
import { addPoints, getUserBalanceInfo } from '@/lib/points/balance';

// GET: 获取积分统计数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const serviceType = searchParams.get('serviceType');
    const userEmail = searchParams.get('userEmail');

    switch (type) {
      case 'stats':
        // 全局消费统计
        return await getConsumptionStats(startDate, endDate);

      case 'pricing':
        // 模型定价配置
        return await getPricingConfig();

      case 'user':
        // 用户积分信息
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        return await getUserPoints(userId);

      case 'users':
        // 用户积分列表（搜索）
        return await searchUsers(userEmail, page, pageSize);

      case 'logs':
        // 消费日志
        return await getConsumptionLogs(userId, serviceType, startDate, endDate, page, pageSize);

      case 'monthly':
        // 月度发放状态
        return await getMonthlyGrantStats();

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin points GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// PUT: 更新定价配置
const updatePricingSchema = z.object({
  modelId: z.string().min(1),
  multiplier: z.number().min(0),
  isEnabled: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updatePricingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { modelId, multiplier, isEnabled } = validation.data;

    // 获取模型配置
    const modelMapping = MODEL_MAPPINGS.find(m => m.modelId === modelId);
    if (!modelMapping) {
      return NextResponse.json(
        { error: 'Unknown model' },
        { status: 404 }
      );
    }

    // 验证倍率修改是否合法
    const pricingConfig = PRICING_CONFIG[modelMapping.serviceType];
    const validationResult = validateMultiplierChange(modelMapping.serviceType, multiplier);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: validationResult.message,
          lockedMin: pricingConfig.minMultiplier,
          isLocked: pricingConfig.isLocked,
        },
        { status: 400 }
      );
    }

    // 更新数据库中的定价
    const existing = await prisma.aIServicePricing.findUnique({
      where: { modelId },
    });

    if (existing) {
      const updated = await prisma.aIServicePricing.update({
        where: { modelId },
        data: {
          profitMultiplier: multiplier,
          ...(isEnabled !== undefined && { isEnabled }),
        },
      });

      return NextResponse.json({
        success: true,
        pricing: {
          ...updated,
          baseCost: Number(updated.baseCost),
          profitMultiplier: Number(updated.profitMultiplier),
          finalPrice: Number(updated.baseCost) * Number(updated.profitMultiplier),
          lockedMin: pricingConfig.minMultiplier,
          isLocked: pricingConfig.isLocked,
        },
      });
    } else {
      // 创建新的定价记录
      const created = await prisma.aIServicePricing.create({
        data: {
          serviceType: modelMapping.serviceType,
          modelId,
          baseCost: pricingConfig.basePoints,
          profitMultiplier: multiplier,
          isEnabled: isEnabled ?? true,
        },
      });

      return NextResponse.json({
        success: true,
        pricing: {
          ...created,
          baseCost: Number(created.baseCost),
          profitMultiplier: Number(created.profitMultiplier),
          finalPrice: Number(created.baseCost) * Number(created.profitMultiplier),
          lockedMin: pricingConfig.minMultiplier,
          isLocked: pricingConfig.isLocked,
        },
      });
    }
  } catch (error) {
    console.error('Admin points PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

// POST: 手动调整用户积分 / 触发月度发放
const adjustPointsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().min(1),
  type: z.enum(['add', 'deduct']).optional(),
});

const triggerMonthlySchema = z.object({
  action: z.literal('grantMonthly'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // 检查是否是触发月度发放
    const monthlyValidation = triggerMonthlySchema.safeParse(body);
    if (monthlyValidation.success) {
      const result = await grantAllMonthlyPoints();
      return NextResponse.json({
        success: true,
        ...result,
        message: `成功为 ${result.successCount} 名会员发放月度积分`,
      });
    }

    // 手动调整积分
    const validation = adjustPointsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, amount, reason, type = 'add' } = validation.data;

    const actualAmount = type === 'deduct' ? -Math.abs(amount) : Math.abs(amount);

    if (actualAmount === 0) {
      return NextResponse.json({ error: 'Amount cannot be zero' }, { status: 400 });
    }

    const result = await addPoints(
      userId,
      actualAmount,
      actualAmount > 0 ? 'BONUS' : 'USAGE',
      `管理员手动调整: ${reason}`
    );

    // 获取用户最新余额
    const balanceInfo = await getUserBalanceInfo(userId);

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      amountAdded: actualAmount,
      newBalance: balanceInfo.totalAvailablePoints,
      permanentPoints: balanceInfo.points,
      monthlyPoints: balanceInfo.monthlyPoints,
    });
  } catch (error) {
    console.error('Admin points POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// === 辅助函数 ===

async function getConsumptionStats(startDate?: string | null, endDate?: string | null) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const customStart = startDate ? new Date(startDate) : null;
  const customEnd = endDate ? new Date(endDate) : null;

  // 今日消费
  const todayConsumption = await prisma.pointsConsumptionLog.aggregate({
    where: { createdAt: { gte: todayStart } },
    _sum: { pointsUsed: true },
    _count: true,
  });

  // 本月消费
  const monthConsumption = await prisma.pointsConsumptionLog.aggregate({
    where: { createdAt: { gte: monthStart } },
    _sum: { pointsUsed: true },
    _count: true,
  });

  // 本年消费
  const yearConsumption = await prisma.pointsConsumptionLog.aggregate({
    where: { createdAt: { gte: yearStart } },
    _sum: { pointsUsed: true },
    _count: true,
  });

  // 按服务类型分组统计
  const byServiceType = await prisma.pointsConsumptionLog.groupBy({
    by: ['serviceType'],
    where: customStart && customEnd
      ? { createdAt: { gte: customStart, lte: customEnd } }
      : { createdAt: { gte: monthStart } },
    _sum: { pointsUsed: true },
    _count: true,
    orderBy: { _sum: { pointsUsed: 'desc' } },
  });

  // 按模型分组统计（最常用模型）
  const byModel = await prisma.pointsConsumptionLog.groupBy({
    by: ['modelId'],
    where: customStart && customEnd
      ? { createdAt: { gte: customStart, lte: customEnd } }
      : { createdAt: { gte: monthStart } },
    _sum: { pointsUsed: true },
    _count: true,
    orderBy: { _count: { modelId: 'desc' } },
    take: 10,
  });

  // 消费最多的用户
  const topConsumers = await prisma.pointsConsumptionLog.groupBy({
    by: ['userId'],
    where: customStart && customEnd
      ? { createdAt: { gte: customStart, lte: customEnd } }
      : { createdAt: { gte: monthStart } },
    _sum: { pointsUsed: true },
    _count: true,
    orderBy: { _sum: { pointsUsed: 'desc' } },
    take: 10,
  });

  // 获取用户详情
  const topUserIds = topConsumers.map(u => u.userId);
  const topUserDetails = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, email: true, name: true, plan: true },
  });

  const topConsumersWithDetails = topConsumers.map(u => ({
    userId: u.userId,
    user: topUserDetails.find(t => t.id === u.userId),
    totalPoints: u._sum.pointsUsed || 0,
    requestCount: u._count,
  }));

  // 系统总体积分统计
  const systemStats = await getSystemPointsStats();

  return NextResponse.json({
    period: {
      today: { points: todayConsumption._sum.pointsUsed || 0, count: todayConsumption._count },
      month: { points: monthConsumption._sum.pointsUsed || 0, count: monthConsumption._count },
      year: { points: yearConsumption._sum.pointsUsed || 0, count: yearConsumption._count },
      custom: customStart && customEnd
        ? { start: customStart, end: customEnd }
        : null,
    },
    byServiceType: byServiceType.map(s => ({
      serviceType: s.serviceType,
      points: s._sum.pointsUsed || 0,
      count: s._count,
    })),
    topModels: byModel.map(m => ({
      modelId: m.modelId,
      points: m._sum.pointsUsed || 0,
      count: m._count,
    })),
    topConsumers: topConsumersWithDetails,
    systemStats,
  });
}

async function getPricingConfig() {
  // 从数据库获取定价
  const dbPricing = await prisma.aIServicePricing.findMany();

  // 合并模型映射和定价配置
  const pricingData = MODEL_MAPPINGS.map(mapping => {
    const dbRecord = dbPricing.find(p => p.modelId === mapping.modelId);
    const config = PRICING_CONFIG[mapping.serviceType];

    const baseCost = dbRecord ? Number(dbRecord.baseCost) : config.basePoints;
    const multiplier = dbRecord ? Number(dbRecord.profitMultiplier) : config.minMultiplier;
    const isEnabled = dbRecord ? dbRecord.isEnabled : true;

    return {
      id: dbRecord?.id || `config-${mapping.modelId}`,
      serviceType: mapping.serviceType,
      modelName: mapping.modelName,
      modelId: mapping.modelId,
      tier: mapping.tier,
      provider: mapping.provider,
      baseCost,
      multiplier,
      finalPrice: Math.ceil(baseCost * multiplier),
      lockedMin: config.minMultiplier,
      isLocked: config.isLocked,
      isEnabled,
      allowedPlans: config.allowedPlans,
      description: config.description,
    };
  });

  // 锁定配置汇总
  const lockedConfigs = Object.entries(PRICING_CONFIG)
    .filter(([_, config]) => config.isLocked)
    .map(([type, config]) => ({
      serviceType: type,
      minMultiplier: config.minMultiplier,
      description: config.description,
    }));

  return NextResponse.json({
    pricing: pricingData,
    lockedConfigs,
    lockedMultipliers: LOCKED_MULTIPLIERS,
  });
}

async function getUserPoints(userId: string) {
  const balanceInfo = await getUserBalanceInfo(userId);
  const quotaConfig = QUOTA_CONFIGS[balanceInfo.plan];

  // 获取用户消费历史（最近50条）
  const history = await prisma.pointsConsumptionLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // 获取用户详情
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user,
    balance: {
      totalAvailable: balanceInfo.totalAvailablePoints,
      permanentPoints: balanceInfo.points,
      monthlyPoints: balanceInfo.monthlyPoints,
      shortDramaQuota: balanceInfo.shortDramaQuota,
      shortDramaUsed: balanceInfo.shortDramaUsed,
      dailyTrialPoints: balanceInfo.dailyTrialPoints,
      dailyTrialUsed: balanceInfo.dailyTrialUsed,
    },
    plan: {
      name: quotaConfig.name,
      monthlyPrice: quotaConfig.monthlyPrice,
      monthlyPointsGrant: quotaConfig.monthlyPoints,
    },
    consumptionHistory: history,
  });
}

async function searchUsers(email?: string | null, page: number = 1, pageSize: number = 20) {
  const where: Record<string, unknown> = {};

  if (email) {
    where.email = { contains: email, mode: 'insensitive' };
  }

  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { credits: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const usersWithPoints = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    createdAt: u.createdAt,
    points: u.credits?.points || 0,
    monthlyPoints: u.credits?.monthlyPoints || 0,
    totalPoints: (u.credits?.points || 0) + (u.credits?.monthlyPoints || 0),
    shortDramaQuota: u.credits?.shortDramaQuota || 0,
    shortDramaUsed: u.credits?.shortDramaUsedThisMonth || 0,
    lastPointsReset: u.credits?.lastPointsReset,
  }));

  return NextResponse.json({
    users: usersWithPoints,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

async function getConsumptionLogs(
  userId?: string | null,
  serviceType?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  page: number = 1,
  pageSize: number = 20
) {
  const where: Record<string, unknown> = {};

  if (userId) {
    where.userId = userId;
  }

  if (serviceType) {
    where.serviceType = serviceType;
  }

  if (startDate || endDate) {
    where.createdAt = {} as Record<string, Date>;
    if (startDate) {
      (where.createdAt as Record<string, Date>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.pointsConsumptionLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.pointsConsumptionLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map(log => ({
      id: log.id,
      createdAt: log.createdAt,
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      serviceType: log.serviceType,
      modelId: log.modelId,
      pointsUsed: log.pointsUsed,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      deductedFrom: log.deductedFrom,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

async function getMonthlyGrantStats() {
  // 查找最近的BONUS类型交易
  const recentGrants = await prisma.pointTransaction.findMany({
    where: {
      type: 'BONUS',
      description: { contains: '月度积分发放' },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 获取上次发放统计
  const lastGrant = recentGrants[0];

  // 统计各会员等级待发放情况
  const usersNeedingGrant = await prisma.user.findMany({
    where: {
      plan: { in: ['BASIC', 'PRO', 'BUSINESS'] },
    },
    include: { credits: true },
  });

  const statsByPlan: Record<Plan, { count: number; totalPoints: number }> = {
    FREE: { count: 0, totalPoints: 0 },
    BASIC: { count: 0, totalPoints: 0 },
    PRO: { count: 0, totalPoints: 0 },
    BUSINESS: { count: 0, totalPoints: 0 },
  };

  for (const user of usersNeedingGrant) {
    const quota = QUOTA_CONFIGS[user.plan];
    statsByPlan[user.plan].count++;
    statsByPlan[user.plan].totalPoints += quota.monthlyPoints;
  }

  return NextResponse.json({
    lastGrant: lastGrant ? {
      date: lastGrant.createdAt,
      count: recentGrants.filter(g =>
        g.createdAt.getTime() === lastGrant.createdAt.getTime()
      ).length,
    } : null,
    pendingGrants: statsByPlan,
    totalPending: {
      users: Object.values(statsByPlan).reduce((sum, s) => sum + s.count, 0),
      points: Object.values(statsByPlan).reduce((sum, s) => sum + s.totalPoints, 0),
    },
    schedule: {
      autoGrant: true,
      scheduledDay: 1,
      nextGrantDate: getNextMonthFirstDay(),
    },
  });
}

function getNextMonthFirstDay(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}