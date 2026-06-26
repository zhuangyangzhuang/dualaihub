import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Points package definitions
const POINTS_PACKAGES = [
  { id: 'points_100', points: 100, price: 10, originalPrice: 10, discount: 0 },
  { id: 'points_500', points: 500, price: 45, originalPrice: 50, discount: 10 },
  { id: 'points_1200', points: 1200, price: 100, originalPrice: 120, discount: 17 },
  { id: 'points_4000', points: 4000, price: 300, originalPrice: 400, discount: 25 },
];

// GET: Get user's points balance and transaction history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get or create user credits (which includes points field)
    let userCredit = await prisma.credit.findUnique({
      where: { userId: session.user.id },
    });

    // Create credit record if doesn't exist
    if (!userCredit) {
      userCredit = await prisma.credit.create({
        data: {
          userId: session.user.id,
          amount: 0,
          points: 0,
        },
      });
    }

    // Get transaction history
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointTransaction.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      balance: userCredit.points,
      totalEarned: userCredit.points,
      totalSpent: 0,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      packages: POINTS_PACKAGES,
    });
  } catch (error) {
    console.error('Points GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points data' },
      { status: 500 }
    );
  }
}

const purchaseSchema = z.object({
  packageId: z.string(),
  paymentMethod: z.enum(['stripe', 'paypal', 'usdt']).optional().default('stripe'),
});

// POST: Purchase points package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = purchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId, paymentMethod } = validation.data;

    // Find the package
    const pkg = POINTS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Get or create user credits (which includes points field)
    let userCredit = await prisma.credit.findUnique({
      where: { userId: session.user.id },
    });

    if (!userCredit) {
      userCredit = await prisma.credit.create({
        data: {
          userId: session.user.id,
          amount: 0,
          points: 0,
        },
      });
    }

    // Create transaction record
    const transaction = await prisma.pointTransaction.create({
      data: {
        userId: session.user.id,
        amount: pkg.points,
        type: 'PURCHASE',
        description: `Purchased ${pkg.points} points for $${pkg.price}`,
      },
    });

    // Update user points balance
    const updatedCredit = await prisma.credit.update({
      where: { userId: session.user.id },
      data: {
        points: userCredit.points + pkg.points,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      newBalance: updatedCredit.points,
      purchasedPoints: pkg.points,
    });
  } catch (error) {
    console.error('Points purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase points' },
      { status: 500 }
    );
  }
}
