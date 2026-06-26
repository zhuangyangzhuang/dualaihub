/**
 * 积分扣减API
 * 
 * POST: 扣减积分用于服务使用
 * Body: { serviceType, modelId, inputTokens, outputTokens }
 * Returns: { success, deductedPoints, remainingPoints }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MODEL_POINTS_COST, checkServiceAccess } from '@/lib/points';

// 扣减请求验证schema
const deductSchema = z.object({
  serviceType: z.string().optional(),
  modelId: z.string().min(1, '请提供模型ID'),
  inputTokens: z.number().int().positive().optional(),
  outputTokens: z.number().int().positive().optional(),
  description: z.string().optional(),
});

/**
 * POST /api/points/deduct
 * 扣减积分用于服务使用
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = deductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '验证失败',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { modelId, description } = validation.data;

    // 查找模型配置
    let modelConfig: { id: string; name: string; serviceType: string; provider: string; points: number } | null = null;
    
    for (const [serviceType, tiers] of Object.entries(MODEL_POINTS_COST)) {
      for (const [tier, models] of Object.entries(tiers as unknown as Record<string, any[]>)) {
        const model = models.find((m) => m.id === modelId);
        if (model) {
          modelConfig = {
            id: model.id,
            name: model.name,
            serviceType,
            provider: model.provider,
            points: model.points,
          };
          break;
        }
      }
      if (modelConfig) break;
    }

    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: `未知的模型: ${modelId}` },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { credits: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查服务权限
    const serviceTypeMap: Record<string, 'text' | 'code' | 'image' | 'video' | 'shortDrama'> = {
      text: 'text',
      code: 'code',
      image: 'image',
      video: 'video',
      shortDrama: 'shortDrama',
    };

    // music 服务类型映射到 video 进行权限检查
    const mappedServiceType = modelConfig.serviceType === 'music' ? 'video' : (serviceTypeMap[modelConfig.serviceType] || 'text');
    const accessCheck = checkServiceAccess(user.plan, mappedServiceType);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.reason || '该服务不允许使用',
          errorType: 'service_not_allowed',
        },
        { status: 403 }
      );
    }

    const credit = user.credits;
    const balance = (credit?.points || 0) + (credit?.monthlyPoints || 0);
    const requiredPoints = modelConfig.points;

    // 检查余额是否充足
    if (balance < requiredPoints) {
      return NextResponse.json(
        {
          success: false,
          error: `积分不足。需要 ${requiredPoints} 点，当前余额 ${balance} 点`,
          errorType: 'insufficient_balance',
          requiredPoints,
          availablePoints: balance,
        },
        { status: 400 }
      );
    }

    // 执行扣减（原子操作）
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 锁定方式获取用户积分
        const userWithCredit = await tx.user.findUnique({
          where: { id: session.user.id },
          include: { credits: true },
        });

        if (!userWithCredit || !userWithCredit.credits) {
          throw new Error('用户积分记录不存在');
        }

        const currentCredit = userWithCredit.credits;
        const currentBalance = currentCredit.points + currentCredit.monthlyPoints;

        if (currentBalance < requiredPoints) {
          throw new Error(`积分不足。需要 ${requiredPoints} 点，当前余额 ${currentBalance} 点`);
        }

        // 优先扣减月度积分，再扣永久积分
        const deductFromMonthly = Math.min(currentCredit.monthlyPoints, requiredPoints);
        const deductFromPermanent = requiredPoints - deductFromMonthly;

        const updateData: Record<string, unknown> = {};
        if (deductFromMonthly > 0) {
          updateData.monthlyPoints = { decrement: deductFromMonthly };
        }
        if (deductFromPermanent > 0) {
          updateData.points = { decrement: deductFromPermanent };
        }

        // 更新积分
        await tx.credit.update({
          where: { userId: session.user.id },
          data: updateData,
        });

        // 记录交易
        const transaction = await tx.pointTransaction.create({
          data: {
            userId: session.user.id,
            amount: -requiredPoints,
            type: 'USAGE',
            description: description || `${modelConfig?.serviceType} - ${modelId}`,
          },
        });

        // 记录消费日志
        await tx.pointsConsumptionLog.create({
          data: {
            userId: session.user.id,
            serviceType: modelConfig?.serviceType || 'unknown',
            modelId,
            pointsUsed: requiredPoints,
            deductedFrom: deductFromMonthly > 0 ? 'MONTHLY' : 'PERMANENT',
          },
        });

        return {
          amount: requiredPoints,
          deductedFrom: deductFromMonthly > 0 ? 'monthly' : 'points',
          remainingPoints: currentBalance - requiredPoints,
          transactionId: transaction.id,
        };
      });

      return NextResponse.json({
        success: true,
        message: '积分扣减成功',
        data: {
          deductedPoints: result.amount,
          deductedFrom: result.deductedFrom,
          remainingPoints: result.remainingPoints,
          transactionId: result.transactionId,
          serviceType: modelConfig.serviceType,
          modelName: modelConfig.name,
          provider: modelConfig.provider,
        },
      });
    } catch (error) {
      console.error('积分扣减失败:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : '积分扣减失败',
          details: error instanceof Error ? error.message : '未知错误',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('积分扣减请求处理失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '积分扣减请求处理失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/points/deduct
 * 获取扣减历史记录（用户自己的消费日志）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const serviceType = searchParams.get('serviceType');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (serviceType) {
      whereClause.serviceType = serviceType;
    }

    // 获取消费日志
    const [logs, total] = await Promise.all([
      prisma.pointsConsumptionLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointsConsumptionLog.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          serviceType: log.serviceType,
          modelId: log.modelId,
          pointsUsed: log.pointsUsed,
          deductedFrom: log.deductedFrom,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取扣减历史失败:', error);
    return NextResponse.json(
      { error: '获取扣减历史失败' },
      { status: 500 }
    );
  }
}
