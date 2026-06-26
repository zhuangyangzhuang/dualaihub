/**
 * 余额检查与扣减系统
 * 
 * 核心防亏损机制：
 * 1. 严格余额检查 - API调用前必须先检查余额
 * 2. 无透支 - 余额不足直接拒绝
 * 3. 原子操作 - 扣减操作使用事务保证一致性
 * 4. 优先扣减顺序：会员免费配额 > 账户积分
 */

import { prisma } from '@/lib/prisma';
import { Plan, PointTransactionType } from '@prisma/client';
import { ServiceType, calculateRequiredPoints, getModelConfig } from './pricing';
import { 
  getQuotaConfig, 
  isServiceAllowedForPlan, 
  shouldDeductPoints,
  getUpgradeSuggestion,
  QUOTA_LIMITS,
} from './quota';

// 错误类型定义
export class InsufficientBalanceError extends Error {
  constructor(
    message: string,
    public requiredPoints: number,
    public availablePoints: number,
    public suggestedAction?: string
  ) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class ServiceNotAllowedError extends Error {
  constructor(
    message: string,
    public currentPlan: Plan,
    public suggestedPlan?: Plan
  ) {
    super(message);
    this.name = 'ServiceNotAllowedError';
  }
}

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public quotaUsed: number,
    public quotaLimit: number
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

// 余额信息接口
export interface BalanceInfo {
  userId: string;
  plan: Plan;
  points: number;                    // 账户积分余额
  monthlyPoints: number;             // 本月发放的月度积分
  shortDramaQuota: number;          // 本月短剧配额
  shortDramaUsed: number;           // 本月已使用的短剧配额
  dailyTrialPoints: number;         // 今日试用积分（FREE用户）
  dailyTrialUsed: number;           // 今日已使用的试用积分
  totalAvailablePoints: number;     // 总可用积分
  lastPointsReset: Date | null;     // 上次积分重置时间
  lastDailyReset: Date;             // 上次日重置时间
}

// 扣减结果接口
export interface DeductionResult {
  success: boolean;
  deductedFrom: 'points' | 'quota' | 'trial' | 'none';
  amount: number;
  remainingPoints: number;
  remainingQuota?: number;
  transactionId?: string;
}

// 扣减前检查结果
export interface PreDeductionCheck {
  canProceed: boolean;
  requiredPoints: number;
  availablePoints: number;
  willUseQuota: boolean;
  willUsePoints: boolean;
  willUseTrial: boolean;
  error?: {
    type: 'insufficient_balance' | 'service_not_allowed' | 'quota_exceeded';
    message: string;
    suggestedAction?: string;
  };
}

/**
 * 获取用户完整余额信息
 */
export async function getUserBalanceInfo(userId: string): Promise<BalanceInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      credits: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const credit = user.credits;
  const now = new Date();

  // 如果没有积分记录，创建一个
  if (!credit) {
    const newCredit = await prisma.credit.create({
      data: {
        userId,
        points: 0,
        monthlyPoints: 0,
        shortDramaQuota: getQuotaConfig(user.plan).shortDramaQuota,
        dailyUsed: 0,
        lastReset: now,
        lastPointsReset: now,
        lastDailyReset: now,
      },
    });

    return {
      userId,
      plan: user.plan,
      points: 0,
      monthlyPoints: 0,
      shortDramaQuota: newCredit.shortDramaQuota,
      shortDramaUsed: 0,
      dailyTrialPoints: user.plan === 'FREE' ? QUOTA_LIMITS.FREE_DAILY_POINTS : 0,
      dailyTrialUsed: 0,
      totalAvailablePoints: user.plan === 'FREE' ? QUOTA_LIMITS.FREE_DAILY_POINTS : 0,
      lastPointsReset: now,
      lastDailyReset: now,
    };
  }

  // 计算总可用积分
  const quotaConfig = getQuotaConfig(user.plan);
  let totalAvailable = credit.points + credit.monthlyPoints;

  // FREE用户加上每日试用积分
  if (user.plan === 'FREE') {
    // 检查是否需要重置每日积分
    const lastDailyReset = credit.lastDailyReset || credit.lastReset;
    const needsDailyReset = shouldResetDailyPoints(lastDailyReset, now);
    
    if (needsDailyReset) {
      // 重置每日积分
      await prisma.credit.update({
        where: { userId },
        data: {
          dailyUsed: 0,
          lastDailyReset: now,
        },
      });
      totalAvailable += QUOTA_LIMITS.FREE_DAILY_POINTS;
    } else {
      const remainingDaily = Math.max(0, QUOTA_LIMITS.FREE_DAILY_POINTS - credit.dailyUsed);
      totalAvailable += remainingDaily;
    }
  }

  return {
    userId,
    plan: user.plan,
    points: credit.points,
    monthlyPoints: credit.monthlyPoints,
    shortDramaQuota: credit.shortDramaQuota,
    shortDramaUsed: credit.shortDramaUsedThisMonth || 0,
    dailyTrialPoints: user.plan === 'FREE' ? QUOTA_LIMITS.FREE_DAILY_POINTS : 0,
    dailyTrialUsed: credit.dailyUsed || 0,
    totalAvailablePoints: totalAvailable,
    lastPointsReset: credit.lastPointsReset,
    lastDailyReset: credit.lastDailyReset || credit.lastReset,
  };
}

/**
 * 检查是否需要重置每日积分
 */
function shouldResetDailyPoints(lastReset: Date, now: Date): boolean {
  const lastResetDay = new Date(
    lastReset.getFullYear(),
    lastReset.getMonth(),
    lastReset.getDate()
  );
  const currentDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  return lastResetDay < currentDay;
}

/**
 * API调用前余额预检查
 * 
 * 核心防亏损机制：在任何API调用之前必须执行此检查
 * 返回详细的检查结果，包括是否可以继续、需要的积分数量等
 */
export async function preDeductionCheck(
  userId: string,
  modelId: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<PreDeductionCheck> {
  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { credits: true },
  });

  if (!user) {
    return {
      canProceed: false,
      requiredPoints: 0,
      availablePoints: 0,
      willUseQuota: false,
      willUsePoints: false,
      willUseTrial: false,
      error: {
        type: 'insufficient_balance',
        message: '用户不存在',
      },
    };
  }

  // 获取模型配置
  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    return {
      canProceed: false,
      requiredPoints: 0,
      availablePoints: 0,
      willUseQuota: false,
      willUsePoints: false,
      willUseTrial: false,
      error: {
        type: 'service_not_allowed',
        message: `未知的模型: ${modelId}`,
      },
    };
  }

  // 检查会员等级是否有权使用该服务
  const serviceCheck = isServiceAllowedForPlan(modelConfig.serviceType, user.plan);
  if (!serviceCheck.allowed) {
    const upgradeSuggestion = getUpgradeSuggestion(user.plan, modelConfig.serviceType);
    return {
      canProceed: false,
      requiredPoints: 0,
      availablePoints: 0,
      willUseQuota: false,
      willUsePoints: false,
      willUseTrial: false,
      error: {
        type: 'service_not_allowed',
        message: serviceCheck.reason,
        suggestedAction: upgradeSuggestion?.message,
      },
    };
  }

  // 获取余额信息
  const balanceInfo = await getUserBalanceInfo(userId);

  // 计算所需积分
  const requiredPoints = calculateRequiredPoints(modelId, inputTokens, outputTokens);

  // 检查是否需要扣减积分
  const hasQuotaRemaining = 
    (modelConfig.serviceType === ServiceType.SHORT_DRAMA_BASIC ||
     modelConfig.serviceType === ServiceType.SHORT_DRAMA_HD) &&
    balanceInfo.shortDramaUsed < balanceInfo.shortDramaQuota;

  const needsDeduction = shouldDeductPoints(
    modelConfig.serviceType,
    user.plan,
    hasQuotaRemaining
  );

  // 如果不需要扣减积分（使用免费配额或免费服务）
  if (!needsDeduction) {
    // 对于FREE用户的每日试用积分，检查是否还有剩余
    if (user.plan === 'FREE' && 
        (modelConfig.serviceType === ServiceType.TEXT_BASIC ||
         modelConfig.serviceType === ServiceType.OPENROUTER_FREE)) {
      const remainingDaily = QUOTA_LIMITS.FREE_DAILY_POINTS - balanceInfo.dailyTrialUsed;
      if (remainingDaily > 0) {
        return {
          canProceed: true,
          requiredPoints: 0,
          availablePoints: remainingDaily,
          willUseQuota: false,
          willUsePoints: false,
          willUseTrial: true,
        };
      } else {
        return {
          canProceed: false,
          requiredPoints: 1,
          availablePoints: 0,
          willUseQuota: false,
          willUsePoints: false,
          willUseTrial: false,
          error: {
            type: 'quota_exceeded',
            message: '今日试用积分已用完，请明天再来或升级会员',
            suggestedAction: '升级至BASIC会员可获得无限基础文本服务',
          },
        };
      }
    }

    // 对于短剧配额
    if (hasQuotaRemaining) {
      return {
        canProceed: true,
        requiredPoints: 0,
        availablePoints: 0,
        willUseQuota: true,
        willUsePoints: false,
        willUseTrial: false,
      };
    }

    // 对于会员的基础服务（不扣积分）
    return {
      canProceed: true,
      requiredPoints: 0,
      availablePoints: balanceInfo.totalAvailablePoints,
      willUseQuota: false,
      willUsePoints: false,
      willUseTrial: false,
    };
  }

  // 需要扣减积分 - 检查余额是否充足
  if (balanceInfo.totalAvailablePoints < requiredPoints) {
    return {
      canProceed: false,  // 关键：余额不足，不允许调用API
      requiredPoints,
      availablePoints: balanceInfo.totalAvailablePoints,
      willUseQuota: false,
      willUsePoints: true,
      willUseTrial: false,
      error: {
        type: 'insufficient_balance',
        message: `积分不足。需要 ${requiredPoints} 积分，当前仅有 ${balanceInfo.totalAvailablePoints} 积分`,
        suggestedAction: '请充值或升级会员获取更多积分',
      },
    };
  }

  return {
    canProceed: true,
    requiredPoints,
    availablePoints: balanceInfo.totalAvailablePoints,
    willUseQuota: false,
    willUsePoints: true,
    willUseTrial: false,
  };
}

/**
 * 执行积分扣减（原子操作）
 * 
 * 核心防亏损机制：
 * 1. 使用事务保证原子性
 * 2. 再次检查余额防止并发问题
 * 3. 记录详细的消费日志
 */
export async function deductPoints(
  userId: string,
  modelId: string,
  serviceType: ServiceType,
  points: number,
  description?: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<DeductionResult> {
  return await prisma.$transaction(async (tx) => {
    // 获取用户及积分信息（锁定）
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { credits: true },
    });

    if (!user || !user.credits) {
      throw new InsufficientBalanceError(
        '用户或积分记录不存在',
        points,
        0
      );
    }

    const credit = user.credits;
    const now = new Date();

    // 处理FREE用户的每日试用积分
    if (user.plan === 'FREE' && 
        (serviceType === ServiceType.TEXT_BASIC ||
         serviceType === ServiceType.OPENROUTER_FREE)) {
      const remainingDaily = QUOTA_LIMITS.FREE_DAILY_POINTS - credit.dailyUsed;
      
      if (remainingDaily > 0) {
        // 使用每日试用积分
        await tx.credit.update({
          where: { userId },
          data: {
            dailyUsed: { increment: 1 },
            lastDailyReset: now,
          },
        });

        return {
          success: true,
          deductedFrom: 'trial',
          amount: 1,
          remainingPoints: credit.points,
          remainingQuota: remainingDaily - 1,
        };
      }
    }

    // 检查是否使用短剧配额
    if ((serviceType === ServiceType.SHORT_DRAMA_BASIC ||
         serviceType === ServiceType.SHORT_DRAMA_HD) &&
        credit.shortDramaUsedThisMonth < credit.shortDramaQuota) {
      
      // 使用配额
      const newUsed = credit.shortDramaUsedThisMonth + 1;
      await tx.credit.update({
        where: { userId },
        data: {
          shortDramaUsedThisMonth: newUsed,
        },
      });

      return {
        success: true,
        deductedFrom: 'quota',
        amount: 1,
        remainingPoints: credit.points,
        remainingQuota: credit.shortDramaQuota - newUsed,
      };
    }

    // 检查是否需要扣积分
    const hasQuotaRemaining = credit.shortDramaUsedThisMonth < credit.shortDramaQuota;
    const needsDeduction = shouldDeductPoints(serviceType, user.plan, hasQuotaRemaining);

    if (!needsDeduction) {
      return {
        success: true,
        deductedFrom: 'none',
        amount: 0,
        remainingPoints: credit.points,
      };
    }

    // 需要扣减积分 - 严格检查余额
    const totalAvailable = credit.points + credit.monthlyPoints;
    
    if (totalAvailable < points) {
      throw new InsufficientBalanceError(
        `积分不足。需要 ${points} 积分，当前仅有 ${totalAvailable} 积分`,
        points,
        totalAvailable,
        '请充值或升级会员'
      );
    }

    // 执行扣减：优先扣月度积分，再扣永久积分
    let deductFromMonthly = 0;
    let deductFromPermanent = 0;

    if (credit.monthlyPoints >= points) {
      deductFromMonthly = points;
    } else {
      deductFromMonthly = credit.monthlyPoints;
      deductFromPermanent = points - credit.monthlyPoints;
    }

    // 更新积分
    await tx.credit.update({
      where: { userId },
      data: {
        monthlyPoints: { decrement: deductFromMonthly },
        points: { decrement: deductFromPermanent },
      },
    });

    // 记录交易
    const transaction = await tx.pointTransaction.create({
      data: {
        userId,
        amount: -points,
        type: 'USAGE',
        description: description || `${serviceType} - ${modelId}`,
      },
    });

    // 记录消费日志
    await tx.pointsConsumptionLog.create({
      data: {
        userId,
        serviceType,
        modelId,
        pointsUsed: points,
        inputTokens,
        outputTokens,
        deductedFrom: deductFromMonthly > 0 ? 'MONTHLY' : 'PERMANENT',
      },
    });

    return {
      success: true,
      deductedFrom: 'points',
      amount: points,
      remainingPoints: credit.points + credit.monthlyPoints - points,
      transactionId: transaction.id,
    };
  });
}

/**
 * 简化的扣减方法（直接通过模型ID）
 */
export async function deductPointsForModel(
  userId: string,
  modelId: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<DeductionResult> {
  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const points = calculateRequiredPoints(modelId, inputTokens, outputTokens);

  return deductPoints(
    userId,
    modelId,
    modelConfig.serviceType,
    points,
    undefined,
    inputTokens,
    outputTokens
  );
}

/**
 * 增加积分（充值或奖励）
 */
export async function addPoints(
  userId: string,
  points: number,
  type: PointTransactionType,
  description?: string
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  return await prisma.$transaction(async (tx) => {
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
    
    if (type === 'BONUS' || type === 'PURCHASE') {
      // 购买和奖励积分加入永久积分
      updateData.points = { increment: points };
    } else if (type === 'REFUND') {
      // 退款积分也加入永久积分
      updateData.points = { increment: points };
    }

    // 更新积分
    await tx.credit.update({
      where: { userId },
      data: updateData,
    });

    // 记录交易
    const transaction = await tx.pointTransaction.create({
      data: {
        userId,
        amount: points,
        type,
        description,
      },
    });

    return {
      success: true,
      newBalance: credit.points + (updateData.points ? points : 0),
      transactionId: transaction.id,
    };
  });
}

/**
 * 获取用户积分消费历史
 */
export async function getPointsHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: Array<{
    id: string;
    amount: number;
    type: PointTransactionType;
    description: string | null;
    createdAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}> {
  const skip = (page - 1) * pageSize;

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.pointTransaction.count({
      where: { userId },
    }),
  ]);

  return {
    transactions,
    total,
    hasMore: skip + pageSize < total,
  };
}

/**
 * 检查用户是否可以执行操作（快速检查）
 */
export async function canUserPerformAction(
  userId: string,
  modelId: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<boolean> {
  const check = await preDeductionCheck(userId, modelId, inputTokens, outputTokens);
  return check.canProceed;
}