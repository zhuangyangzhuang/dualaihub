/**
 * 管理员积分管理API
 * 
 * GET: 获取所有积分消费日志（分页）
 * POST: 手动调整用户积分（管理员专用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 调整积分请求验证schema
const adjustPointsSchema = z.object({
  userId: z.string().min(1, '请提供用户ID'),
  amount: z.number().int().min(-10000).max(10000),
  type: z.enum(['PURCHASE', 'BONUS', 'REFUND', 'EXPIRATION']),
  description: z.string().min(5, '请提供调整说明'),
});

/**
 * GET /api/points/admin
 * 获取所有积分消费日志（管理员查看）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const whereClause: Record<string, unknown> = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {} as Record<string, Date>;
      if (startDate) {
        (whereClause.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // 获取交易记录
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              plan: true,
            },
          },
        },
      }),
      prisma.pointTransaction.count({
        where: whereClause,
      }),
    ]);

    // 获取系统统计
    const [userCount, creditStats, monthlyUsage] = await Promise.all([
      prisma.user.count(),
      prisma.credit.aggregate({
        _sum: { points: true, monthlyPoints: true },
      }),
      prisma.pointTransaction.aggregate({
        where: { type: 'USAGE', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { amount: true },
      }),
    ]);

    const stats = {
      totalUsers: userCount,
      totalPointsInSystem: creditStats._sum.points || 0,
      totalMonthlyPoints: creditStats._sum.monthlyPoints || 0,
      totalPointsConsumedThisMonth: Math.abs(monthlyUsage._sum.amount || 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          user: t.user,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        systemStats: stats,
      },
    });
  } catch (error) {
    console.error('获取积分管理数据失败:', error);
    return NextResponse.json(
      { error: '获取积分管理数据失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/points/admin
 * 手动调整用户积分（管理员专用）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const validation = adjustPointsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, amount, type, description } = validation.data;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 如果是扣减，检查余额是否充足
    if (amount < 0) {
      const totalPoints = (user.credits?.points || 0) + (user.credits?.monthlyPoints || 0);
      if (totalPoints < Math.abs(amount)) {
        return NextResponse.json(
          {
            error: '用户积分余额不足',
            currentBalance: totalPoints,
            requestedDeduction: Math.abs(amount),
          },
          { status: 400 }
        );
      }
    }

    // 执行调整
    const adjustedAmount = amount < 0 ? Math.abs(amount) : amount;

    // 使用事务执行积分调整
    const result = await prisma.$transaction(async (tx) => {
      // 获取或创建积分记录
      let credit = await tx.credit.findUnique({
        where: { userId },
      });

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

      // 根据类型决定加到哪个字段
      const updateData: Record<string, unknown> = {};
      
      if (amount > 0) {
        if (type === 'BONUS' || type === 'PURCHASE' || type === 'REFUND') {
          updateData.points = { increment: adjustedAmount };
        }
      } else {
        // 扣减 - 优先扣月度积分，再扣永久积分
        const deductFromMonthly = Math.min(credit.monthlyPoints, adjustedAmount);
        const deductFromPermanent = adjustedAmount - deductFromMonthly;
        
        if (deductFromMonthly > 0) {
          updateData.monthlyPoints = { decrement: deductFromMonthly };
        }
        if (deductFromPermanent > 0) {
          updateData.points = { decrement: deductFromPermanent };
        }
      }

      // 更新积分
      const updatedCredit = await tx.credit.update({
        where: { userId },
        data: updateData,
      });

      // 记录交易
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          amount: amount,
          type,
          description: `[管理员调整] ${description} - 管理员: ${session.user.email}`,
        },
      });

      return {
        newBalance: updatedCredit.points + updatedCredit.monthlyPoints,
        transactionId: transaction.id,
      };
    });

    // 记录管理员操作日志
    console.log('管理员积分调整:', {
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: userId,
      amount: adjustedAmount,
      type,
      description,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '积分调整成功',
      data: {
        userId,
        amount: adjustedAmount,
        type,
        description,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        adjustedBy: session.user.email,
      },
    });
  } catch (error) {
    console.error('积分调整失败:', error);
    return NextResponse.json(
      { error: '积分调整失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
