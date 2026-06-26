import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List transactions with filters
const getTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().optional(),
  type: z.enum(['SUBSCRIPTION', 'ONE_TIME', 'USDT', 'REFUND']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = getTransactionsSchema.safeParse(Object.fromEntries(searchParams));

    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: params.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, userId, type, status, paymentMethod, startDate, endDate } = params.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.transaction.aggregate({
      where,
      _count: true,
      _sum: {
        amount: true,
      },
    });

    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const typeCounts = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalCount: summary._count,
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
        byType: Object.fromEntries(typeCounts.map((t) => [t.type, t._count])),
      },
    });
  } catch (error) {
    console.error('Admin transactions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
