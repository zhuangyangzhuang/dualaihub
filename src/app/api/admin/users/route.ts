import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List users with pagination
const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'BUSINESS']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = getUsersSchema.safeParse(Object.fromEntries(searchParams));

    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: params.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, search, role, plan } = params.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (plan) where.plan = plan;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          _count: {
            select: {
              transactions: true,
              aiHistory: true,
            },
          },
          credits: {
            select: {
              amount: true,
              dailyUsed: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: User actions (suspend, activate, delete)
const userActionSchema = z.object({
  action: z.enum(['suspend', 'activate', 'delete']),
  userId: z.string().min(1),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validation = userActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, userId, reason } = validation.data;

    // Prevent self-modification
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'suspend':
        // Set plan to FREE and log the action
        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'FREE' },
        });
        // Optionally create a suspension record in a separate table
        return NextResponse.json({
          success: true,
          message: `User ${user.email} has been suspended`,
        });

      case 'activate':
        // Reactivate with their previous plan or FREE
        await prisma.user.update({
          where: { id: userId },
          data: { plan: user.plan === 'FREE' ? 'BASIC' : user.plan },
        });
        return NextResponse.json({
          success: true,
          message: `User ${user.email} has been activated`,
        });

      case 'delete':
        // Soft delete or hard delete depending on requirements
        // Here we hard delete - user data will be removed due to CASCADE
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({
          success: true,
          message: `User ${user.email} has been deleted`,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}
