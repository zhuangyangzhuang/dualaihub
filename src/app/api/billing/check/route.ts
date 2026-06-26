/**
 * 预API计费检查API
 * 
 * POST: 检查用户是否可以使用特定模型
 * Body: { modelId, estimatedTokens }
 * Returns: { canProceed, requiredPoints, currentBalance, error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MODEL_POINTS_COST, checkServiceAccess } from '@/lib/points';

// 检查请求验证schema
const checkSchema = z.object({
  modelId: z.string().min(1, '请提供模型ID'),
  estimatedInputTokens: z.number().int().positive().optional(),
  estimatedOutputTokens: z.number().int().positive().optional(),
});

/**
 * POST /api/billing/check
 * 检查用户是否可以使用特定模型
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          canProceed: false,
          error: '未授权访问',
          errorType: 'auth_error',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = checkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          canProceed: false,
          error: '验证失败',
          errorType: 'validation_error',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { modelId } = validation.data;

    // 查找模型配置
    let modelConfig: { id: string; name: string; serviceType: string; tier: string; provider: string; points: number; multiplier: number } | null = null;
    
    for (const [serviceType, tiers] of Object.entries(MODEL_POINTS_COST)) {
      for (const [tier, models] of Object.entries(tiers as unknown as Record<string, any[]>)) {
        const model = models.find((m) => m.id === modelId);
        if (model) {
          modelConfig = {
            id: model.id,
            name: model.name,
            serviceType,
            tier,
            provider: model.provider,
            points: model.points,
            multiplier: model.multiplier,
          };
          break;
        }
      }
      if (modelConfig) break;
    }

    if (!modelConfig) {
      return NextResponse.json(
        {
          canProceed: false,
          error: `未知的模型: ${modelId}`,
          errorType: 'model_not_found',
          modelId,
        },
        { status: 400 }
      );
    }

    // 获取用户余额信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { credits: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          canProceed: false,
          error: '用户不存在',
          errorType: 'user_not_found',
        },
        { status: 404 }
      );
    }

    const credit = user.credits;
    const balance = credit?.points || 0;
    const monthlyPoints = credit?.monthlyPoints || 0;
    const totalAvailable = balance + monthlyPoints;

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
          canProceed: false,
          error: accessCheck.reason || '该服务不允许使用',
          errorType: 'service_not_allowed',
          serviceNotAllowed: {
            currentPlan: user.plan,
            serviceType: modelConfig.serviceType,
          },
        },
        { status: 403 }
      );
    }

    // 计算所需积分
    const requiredPoints = modelConfig.points;

    return NextResponse.json({
      canProceed: totalAvailable >= requiredPoints,
      model: {
        id: modelConfig.id,
        name: modelConfig.name,
        serviceType: modelConfig.serviceType,
        tier: modelConfig.tier,
        provider: modelConfig.provider,
      },
      user: {
        plan: user.plan,
        planName: user.plan,
      },
      balance: {
        totalPoints: totalAvailable,
        permanentPoints: balance,
        monthlyPoints: monthlyPoints,
      },
      cost: {
        requiredPoints,
      },
      error: totalAvailable < requiredPoints ? `积分不足。需要 ${requiredPoints} 点，当前余额 ${totalAvailable} 点` : undefined,
    });
  } catch (error) {
    console.error('计费检查失败:', error);
    return NextResponse.json(
      {
        canProceed: false,
        error: '计费检查失败',
        errorType: 'system_error',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/check
 * 获取用户的计费状态概览（快速检查）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: '未授权访问',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    // 如果没有提供modelId，返回用户的整体状态
    if (!modelId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { credits: true },
      });

      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const credit = user.credits;
      const balance = credit?.points || 0;
      const monthlyPoints = credit?.monthlyPoints || 0;

      return NextResponse.json({
        success: true,
        data: {
          plan: {
            type: user.plan,
            name: user.plan,
          },
          balance: {
            total: balance + monthlyPoints,
            permanent: balance,
            monthly: monthlyPoints,
          },
        },
      });
    }

    // 如果提供了modelId，返回该模型的使用状态
    let modelConfig: { id: string; name: string; serviceType: string; points: number } | null = null;
    
    for (const [serviceType, tiers] of Object.entries(MODEL_POINTS_COST)) {
      for (const [tier, models] of Object.entries(tiers as unknown as Record<string, any[]>)) {
        const model = models.find((m) => m.id === modelId);
        if (model) {
          modelConfig = {
            id: model.id,
            name: model.name,
            serviceType,
            points: model.points,
          };
          break;
        }
      }
      if (modelConfig) break;
    }

    if (!modelConfig) {
      return NextResponse.json(
        {
          error: `未知的模型: ${modelId}`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const credit = user.credits;
    const balance = (credit?.points || 0) + (credit?.monthlyPoints || 0);

    return NextResponse.json({
      success: true,
      data: {
        modelId,
        modelName: modelConfig.name,
        serviceType: modelConfig.serviceType,
        canProceed: balance >= modelConfig.points,
        requiredPoints: modelConfig.points,
      },
    });
  } catch (error) {
    console.error('获取计费状态失败:', error);
    return NextResponse.json(
      {
        error: '获取计费状态失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
