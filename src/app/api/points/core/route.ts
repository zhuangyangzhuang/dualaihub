/**
 * 主积分API
 * 
 * GET: 获取用户当前积分余额、月度配额、短剧配额
 * POST: 购买积分套餐（连接支付）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { POINTS_PACKAGES, POINTS_EXCHANGE_RATE } from '@/lib/points';

// 积分套餐定义
const PACKAGES = [
  {
    id: 'small',
    points: 100,
    price: 4.99,
    originalPrice: 4.99,
    discount: 0,
    name: '基础包',
    popular: false,
  },
  {
    id: 'medium',
    points: 500,
    price: 19.99,
    originalPrice: 24.99,
    discount: 20,
    name: '标准包',
    popular: true,
  },
  {
    id: 'large',
    points: 1200,
    price: 39.99,
    originalPrice: 49.99,
    discount: 20,
    name: '大包',
    popular: false,
  },
  {
    id: 'huge',
    points: 4000,
    price: 99.99,
    originalPrice: 129.99,
    discount: 23,
    name: '超大包',
    popular: false,
  },
];

/**
 * GET /api/points/core
 * 获取用户当前积分余额、月度配额、短剧配额
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const credit = user.credits;
    const points = credit?.points || 0;
    const monthlyPoints = credit?.monthlyPoints || 0;
    const totalPoints = points + monthlyPoints;

    // 获取本月的消费总额
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyConsumption = await prisma.pointTransaction.aggregate({
      where: {
        userId: session.user.id,
        type: 'USAGE',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    // 获取总消费
    const totalConsumption = await prisma.pointTransaction.aggregate({
      where: {
        userId: session.user.id,
        type: 'USAGE',
      },
      _sum: { amount: true },
    });

    // 获取最近的交易记录
    const recentTransactions = await prisma.pointTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          totalPoints,
          permanentPoints: points,
          monthlyPoints,
          shortDramaQuota: credit?.shortDramaQuota || 0,
          shortDramaUsed: credit?.shortDramaUsedThisMonth || 0,
          shortDramaRemaining: (credit?.shortDramaQuota || 0) - (credit?.shortDramaUsedThisMonth || 0),
        },
        plan: {
          name: user.plan,
          type: user.plan,
        },
        consumption: {
          thisMonth: Math.abs(monthlyConsumption._sum.amount || 0),
          allTime: Math.abs(totalConsumption._sum.amount || 0),
        },
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          createdAt: t.createdAt,
        })),
        packages: PACKAGES,
      },
    });
  } catch (error) {
    console.error('获取积分信息失败:', error);
    return NextResponse.json(
      { error: '获取积分信息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// 购买请求验证schema
const purchaseSchema = z.object({
  packageId: z.string().min(1, '请选择套餐'),
  paymentMethod: z.enum(['stripe', 'paypal', 'usdt']).default('stripe'),
});

/**
 * POST /api/points/core
 * 购买积分套餐（创建支付订单）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const validation = purchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '验证失败', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId, paymentMethod } = validation.data;

    // 查找套餐
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: '无效的套餐ID' }, { status: 400 });
    }

    // 创建交易记录（待支付状态）
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'ONE_TIME',
        amount: pkg.price,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod,
        creditsGranted: pkg.points,
        description: `购买积分套餐: ${pkg.name} (${pkg.points}积分)`,
      },
    });

    // 根据支付方式返回不同的支付信息
    let paymentData;

    switch (paymentMethod) {
      case 'stripe':
        paymentData = {
          requiresAction: true,
          actionType: 'stripe_checkout',
          transactionId: transaction.id,
        };
        break;

      case 'paypal':
        paymentData = {
          requiresAction: true,
          actionType: 'paypal_checkout',
          transactionId: transaction.id,
        };
        break;

      case 'usdt':
        const settings = await prisma.settings.findUnique({
          where: { id: 'global' },
        });
        paymentData = {
          requiresAction: true,
          actionType: 'usdt_payment',
          transactionId: transaction.id,
          usdtAddress: settings?.usdtAddress || '',
          amount: pkg.price,
          points: pkg.points,
        };
        break;

      default:
        throw new Error(`不支持的支付方式: ${paymentMethod}`);
    }

    return NextResponse.json({
      success: true,
      message: '订单创建成功',
      data: {
        transaction: {
          id: transaction.id,
          amount: pkg.price,
          currency: 'USD',
          points: pkg.points,
          status: 'PENDING',
          paymentMethod,
        },
        package: pkg,
        payment: paymentData,
      },
    });
  } catch (error) {
    console.error('购买积分失败:', error);
    return NextResponse.json(
      { error: '购买积分失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/points/core
 * 确认支付成功后充值积分（由webhook调用）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, userId, points } = body;

    // 验证是否来自webhook或内部调用
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 原子操作：更新交易状态并充值积分
    const result = await prisma.$transaction(async (tx) => {
      // 获取交易记录
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error('交易记录不存在');
      }

      if (transaction.status === 'COMPLETED') {
        throw new Error('交易已完成');
      }

      // 更新交易状态
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          creditsGranted: points,
        },
      });

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

      // 充值积分（加入永久积分）
      const updatedCredit = await tx.credit.update({
        where: { userId },
        data: {
          points: { increment: points },
        },
      });

      // 记录交易
      const pointTransaction = await tx.pointTransaction.create({
        data: {
          userId,
          amount: points,
          type: 'PURCHASE',
          description: `购买积分套餐 - ${points}积分`,
        },
      });

      return {
        newBalance: updatedCredit.points,
        transactionId: pointTransaction.id,
      };
    });

    return NextResponse.json({
      success: true,
      message: '积分充值成功',
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (error) {
    console.error('充值积分失败:', error);
    return NextResponse.json(
      { error: '充值积分失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
