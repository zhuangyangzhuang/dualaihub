import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Platform analytics data
const getAnalyticsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = getAnalyticsSchema.safeParse(Object.fromEntries(searchParams));

    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: params.error.flatten() },
        { status: 400 }
      );
    }

    const { period } = params.data;

    // Calculate date range
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // User statistics
    const [totalUsers, newUsers, usersByPlan, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.user.groupBy({
        by: ['plan'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    // Transaction statistics
    const [
      totalTransactions,
      transactionStats,
      transactionsByType,
      transactionsByStatus,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // AI usage statistics
    const [
      totalAIRequests,
      aiUsageByService,
      aiUsageByModel,
      topUsersByAI,
    ] = await Promise.all([
      prisma.aIHistory.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.aIHistory.groupBy({
        by: ['serviceType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { creditsUsed: true },
      }),
      prisma.aIHistory.groupBy({
        by: ['model'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { creditsUsed: true },
        orderBy: { _count: { model: 'desc' } },
        take: 10,
      }),
      prisma.aIHistory.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { creditsUsed: true },
        orderBy: { _sum: { creditsUsed: 'desc' } },
        take: 10,
      }),
    ]);

    // Get top user details
    const topUserIds = topUsersByAI.map((u) => u.userId);
    const topUserDetails = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, email: true, name: true },
    });

    const topUsersWithDetails = topUsersByAI.map((u) => ({
      ...u,
      user: topUserDetails.find((t) => t.id === u.userId),
    }));

    // Revenue by day (for charting)
    const revenueByDay = await getRevenueByDay(startDate, now);

    return NextResponse.json({
      period: {
        start: startDate,
        end: now,
        days,
      },
      users: {
        total: totalUsers,
        new: newUsers,
        byPlan: Object.fromEntries(usersByPlan.map((u) => [u.plan, u._count])),
        byRole: Object.fromEntries(usersByRole.map((u) => [u.role, u._count])),
      },
      transactions: {
        total: totalTransactions,
        totalVolume: transactionStats._sum.amount || 0,
        averageAmount: transactionStats._avg.amount || 0,
        byType: Object.fromEntries(
          transactionsByType.map((t) => [t.type, { count: t._count, volume: t._sum.amount || 0 }])
        ),
        byStatus: Object.fromEntries(transactionsByStatus.map((s) => [s.status, s._count])),
        recent: recentTransactions,
      },
      ai: {
        totalRequests: totalAIRequests,
        byService: Object.fromEntries(
          aiUsageByService.map((s) => [s.serviceType, { count: s._count, credits: s._sum.creditsUsed || 0 }])
        ),
        topModels: aiUsageByModel.map((m) => ({
          model: m.model,
          count: m._count,
          credits: m._sum.creditsUsed || 0,
        })),
        topUsers: topUsersWithDetails.map((u) => ({
          userId: u.userId,
          user: u.user,
          requestCount: u._count,
          creditsUsed: u._sum.creditsUsed || 0,
        })),
      },
      revenueByDay,
    });
  } catch (error) {
    console.error('Admin analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getRevenueByDay(
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; revenue: number; transactions: number }>> {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  // Group by day
  const byDay: Record<string, { revenue: number; transactions: number }> = {};

  for (const tx of transactions) {
    const dateKey = tx.createdAt.toISOString().split('T')[0];
    if (!byDay[dateKey]) {
      byDay[dateKey] = { revenue: 0, transactions: 0 };
    }
    byDay[dateKey].revenue += Number(tx.amount);
    byDay[dateKey].transactions += 1;
  }

  // Fill in missing days
  const result: Array<{ date: string; revenue: number; transactions: number }> = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    result.push({
      date: dateKey,
      revenue: byDay[dateKey]?.revenue || 0,
      transactions: byDay[dateKey]?.transactions || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}
