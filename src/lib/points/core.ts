/**
 * 核心积分结算系统
 * 
 * 这是DUALAIHUB的核心防亏损系统，确保所有AI服务调用都经过严格的积分结算
 * 
 * 核心原则：
 * 1. 所有AI功能必须基于积分计费
 * 2. 严格余额检查 - API调用前必须先检查余额
 * 3. 无透支、无债务、无信用 - 完全防亏损
 * 4. 积分永久有效，永不过期
 */

import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';
import { 
  ServiceType, 
  calculateRequiredPoints, 
  getModelConfig,
  canUseService,
  getServicePricing,
  LOCKED_MULTIPLIERS,
} from './pricing';
import { 
  getQuotaConfig, 
  QUOTA_CONFIGS,
  QUOTA_LIMITS,
  shouldResetMonthlyQuota,
} from './quota';
import {
  preDeductionCheck,
  deductPoints,
  deductPointsForModel,
  getUserBalanceInfo,
  addPoints,
  InsufficientBalanceError,
  ServiceNotAllowedError,
  PreDeductionCheck,
  DeductionResult,
  BalanceInfo,
} from './balance';

// 导出所有子模块的功能
export * from './pricing';
export * from './quota';
export * from './balance';

/**
 * =====================================================
 * 核心结算函数
 * =====================================================
 */

/**
 * API调用前必须执行的检查和准备
 * 
 * 这是防亏损的核心入口点
 * 
 * @returns 如果余额不足或服务不允许，返回false；否则返回true
 */
export async function prepareApiCall(
  userId: string,
  modelId: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<{
  canProceed: boolean;
  check: PreDeductionCheck;
  error?: string;
}> {
  try {
    const check = await preDeductionCheck(userId, modelId, inputTokens, outputTokens);
    
    if (!check.canProceed) {
      return {
        canProceed: false,
        check,
        error: check.error?.message || '无法执行API调用',
      };
    }
    
    return {
      canProceed: true,
      check,
    };
  } catch (error) {
    return {
      canProceed: false,
      check: {
        canProceed: false,
        requiredPoints: 0,
        availablePoints: 0,
        willUseQuota: false,
        willUsePoints: false,
        willUseTrial: false,
        error: {
          type: 'insufficient_balance',
          message: error instanceof Error ? error.message : '未知错误',
        },
      },
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * API调用后执行积分结算
 * 
 * 注意：此函数应该在API成功调用后执行
 * 如果API调用失败，不应该扣减积分
 */
export async function settleApiCall(
  userId: string,
  modelId: string,
  inputTokens?: number,
  outputTokens?: number,
  apiCallSuccess: boolean = true
): Promise<DeductionResult> {
  if (!apiCallSuccess) {
    // API调用失败，不扣减积分
    return {
      success: false,
      deductedFrom: 'none',
      amount: 0,
      remainingPoints: 0,
    };
  }
  
  return deductPointsForModel(userId, modelId, inputTokens, outputTokens);
}

/**
 * 完整的API调用包装器
 * 
 * 包含：预检查 -> 执行API -> 结算积分
 * 
 * 使用示例：
 * const result = await executeWithBilling(userId, 'gpt-4o', async () => {
 *   return await openai.chat.completions.create(...);
 * });
 */
export async function executeWithBilling<T>(
  userId: string,
  modelId: string,
  apiCallFn: () => Promise<T>,
  inputTokens?: number,
  outputTokens?: number
): Promise<{
  success: boolean;
  result?: T;
  deduction?: DeductionResult;
  error?: string;
}> {
  // 步骤1：预检查余额
  const prepare = await prepareApiCall(userId, modelId, inputTokens, outputTokens);
  
  if (!prepare.canProceed) {
    return {
      success: false,
      error: prepare.error || '余额不足或服务不可用',
    };
  }
  
  try {
    // 步骤2：执行API调用
    const result = await apiCallFn();
    
    // 步骤3：结算积分（API成功后才扣减）
    const deduction = await settleApiCall(
      userId,
      modelId,
      inputTokens,
      outputTokens,
      true
    );
    
    return {
      success: true,
      result,
      deduction,
    };
  } catch (error) {
    // API调用失败，不扣减积分
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API调用失败',
    };
  }
}

/**
 * =====================================================
 * 会员月度积分发放
 * =====================================================
 */

/**
 * 发放会员月度积分
 * 
 * 每月自动发放的积分：
 * - BASIC: 300积分
 * - PRO: 1200积分
 * - BUSINESS: 4000积分
 */
export async function grantMonthlyPoints(userId: string): Promise<{
  success: boolean;
  pointsGranted: number;
  shortDramaQuotaGranted: number;
  message: string;
}> {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { credits: true },
    });
    
    if (!user) {
      return {
        success: false,
        pointsGranted: 0,
        shortDramaQuotaGranted: 0,
        message: '用户不存在',
      };
    }
    
    // FREE用户不发放月度积分
    if (user.plan === 'FREE') {
      return {
        success: true,
        pointsGranted: 0,
        shortDramaQuotaGranted: 0,
        message: 'FREE用户无月度积分',
      };
    }
    
    const quotaConfig = getQuotaConfig(user.plan);
    const now = new Date();
    
    // 检查是否需要发放（检查上次发放时间）
    const credit = user.credits;
    
    if (credit) {
      const lastReset = credit.lastPointsReset;
      
      if (lastReset && !shouldResetMonthlyQuota(lastReset, now)) {
        return {
          success: false,
          pointsGranted: 0,
          shortDramaQuotaGranted: 0,
          message: '本月积分已发放',
        };
      }
      
      // 更新月度积分和配额
      await tx.credit.update({
        where: { userId },
        data: {
          monthlyPoints: quotaConfig.monthlyPoints,
          shortDramaQuota: quotaConfig.shortDramaQuota,
          shortDramaUsedThisMonth: 0,  // 重置使用量
          lastPointsReset: now,
        },
      });
    } else {
      // 创建新的积分记录
      await tx.credit.create({
        data: {
          userId,
          points: 0,
          monthlyPoints: quotaConfig.monthlyPoints,
          shortDramaQuota: quotaConfig.shortDramaQuota,
          shortDramaUsedThisMonth: 0,
          lastReset: now,
          lastPointsReset: now,
          lastDailyReset: now,
        },
      });
    }
    
    // 记录交易
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: quotaConfig.monthlyPoints,
        type: 'BONUS',
        description: `${quotaConfig.name}会员月度积分发放`,
      },
    });
    
    return {
      success: true,
      pointsGranted: quotaConfig.monthlyPoints,
      shortDramaQuotaGranted: quotaConfig.shortDramaQuota,
      message: `成功发放${quotaConfig.name}会员月度积分 ${quotaConfig.monthlyPoints} 点，短剧配额 ${quotaConfig.shortDramaQuota} 次`,
    };
  });
}

/**
 * 批量发放所有会员的月度积分
 * 
 * 通常由定时任务调用（每月1日）
 */
export async function grantAllMonthlyPoints(): Promise<{
  totalUsers: number;
  successCount: number;
  failCount: number;
  details: Array<{ userId: string; plan: Plan; pointsGranted: number }>;
}> {
  // 获取所有付费会员
  const users = await prisma.user.findMany({
    where: {
      plan: { in: ['BASIC', 'PRO', 'BUSINESS'] },
    },
    include: { credits: true },
  });
  
  const details: Array<{ userId: string; plan: Plan; pointsGranted: number }> = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const user of users) {
    const result = await grantMonthlyPoints(user.id);
    
    if (result.success) {
      successCount++;
      details.push({
        userId: user.id,
        plan: user.plan,
        pointsGranted: result.pointsGranted,
      });
    } else {
      failCount++;
    }
  }
  
  return {
    totalUsers: users.length,
    successCount,
    failCount,
    details,
  };
}

/**
 * =====================================================
 * 积分充值系统
 * =====================================================
 */

// 积分充值套餐
export const POINTS_PACKAGES = {
  SMALL: { points: 100, price: 4.99, name: '基础包' },
  MEDIUM: { points: 500, price: 19.99, name: '标准包' },
  LARGE: { points: 1200, price: 39.99, name: '大包' },
  HUGE: { points: 4000, price: 99.99, name: '超大包' },
} as const;

/**
 * 用户充值积分
 */
export async function purchasePoints(
  userId: string,
  packageKey: keyof typeof POINTS_PACKAGES
): Promise<{
  success: boolean;
  pointsAdded: number;
  newBalance: number;
  transactionId?: string;
  message: string;
}> {
  const packageInfo = POINTS_PACKAGES[packageKey];
  
  if (!packageInfo) {
    return {
      success: false,
      pointsAdded: 0,
      newBalance: 0,
      message: '无效的充值套餐',
    };
  }
  
  try {
    const result = await addPoints(
      userId,
      packageInfo.points,
      'PURCHASE',
      `充值${packageInfo.name} - ${packageInfo.points}积分`
    );
    
    return {
      success: true,
      pointsAdded: packageInfo.points,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      message: `成功充值${packageInfo.points}积分`,
    };
  } catch (error) {
    return {
      success: false,
      pointsAdded: 0,
      newBalance: 0,
      message: error instanceof Error ? error.message : '充值失败',
    };
  }
}

/**
 * =====================================================
 * 统计和报告
 * =====================================================
 */

/**
 * 获取用户积分统计概览
 */
export async function getUserPointsSummary(userId: string): Promise<{
  plan: Plan;
  planName: string;
  totalPoints: number;
  monthlyPoints: number;
  permanentPoints: number;
  shortDramaQuota: number;
  shortDramaUsed: number;
  dailyTrialPoints: number;
  dailyTrialUsed: number;
  totalConsumedThisMonth: number;
  totalConsumedAllTime: number;
}> {
  const balanceInfo = await getUserBalanceInfo(userId);
  
  // 获取本月消费总额
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyConsumption = await prisma.pointTransaction.aggregate({
    where: {
      userId,
      type: 'USAGE',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });
  
  // 获取总消费
  const totalConsumption = await prisma.pointTransaction.aggregate({
    where: {
      userId,
      type: 'USAGE',
    },
    _sum: { amount: true },
  });
  
  const quotaConfig = getQuotaConfig(balanceInfo.plan);
  
  return {
    plan: balanceInfo.plan,
    planName: quotaConfig.name,
    totalPoints: balanceInfo.totalAvailablePoints,
    monthlyPoints: balanceInfo.monthlyPoints,
    permanentPoints: balanceInfo.points,
    shortDramaQuota: balanceInfo.shortDramaQuota,
    shortDramaUsed: balanceInfo.shortDramaUsed,
    dailyTrialPoints: balanceInfo.dailyTrialPoints,
    dailyTrialUsed: balanceInfo.dailyTrialUsed,
    totalConsumedThisMonth: Math.abs(monthlyConsumption._sum.amount || 0),
    totalConsumedAllTime: Math.abs(totalConsumption._sum.amount || 0),
  };
}

/**
 * 获取系统总体积分统计（管理员用）
 */
export async function getSystemPointsStats(): Promise<{
  totalUsers: number;
  totalPointsInSystem: number;
  totalMonthlyPoints: number;
  totalPointsConsumedThisMonth: number;
  usersByPlan: Record<Plan, number>;
}> {
  // 统计用户数量
  const usersByPlan = await prisma.user.groupBy({
    by: ['plan'],
    _count: true,
  });
  
  // 统计总积分
  const creditsStats = await prisma.credit.aggregate({
    _sum: {
      points: true,
      monthlyPoints: true,
    },
    _count: true,
  });
  
  // 统计本月消费
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyConsumption = await prisma.pointTransaction.aggregate({
    where: {
      type: 'USAGE',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });
  
  const planCounts: Record<Plan, number> = {
    FREE: 0,
    BASIC: 0,
    PRO: 0,
    BUSINESS: 0,
  };
  
  for (const group of usersByPlan) {
    planCounts[group.plan] = group._count;
  }
  
  return {
    totalUsers: usersByPlan.reduce((sum, g) => sum + g._count, 0),
    totalPointsInSystem: creditsStats._sum.points || 0,
    totalMonthlyPoints: creditsStats._sum.monthlyPoints || 0,
    totalPointsConsumedThisMonth: Math.abs(monthlyConsumption._sum.amount || 0),
    usersByPlan: planCounts,
  };
}

/**
 * =====================================================
 * 积分验证工具
 * =====================================================
 */

/**
 * 验证积分系统完整性
 * 
 * 用于检测异常情况：
 * - 积分是否为负数
 * - 交易记录是否一致
 * - 配额是否超出限制
 */
export async function validatePointsSystem(userId: string): Promise<{
  isValid: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { credits: true },
  });
  
  if (!user) {
    issues.push('用户不存在');
    return { isValid: false, issues, warnings };
  }
  
  if (!user.credits) {
    warnings.push('用户无积分记录');
    return { isValid: true, issues, warnings };
  }
  
  const credit = user.credits;
  
  // 检查积分是否为负数
  if (credit.points < 0) {
    issues.push(`永久积分为负数: ${credit.points}`);
  }
  
  if (credit.monthlyPoints < 0) {
    issues.push(`月度积分为负数: ${credit.monthlyPoints}`);
  }
  
  // 检查短剧配额是否超出
  if (credit.shortDramaUsedThisMonth > credit.shortDramaQuota) {
    issues.push(`短剧使用超出配额: 使用${credit.shortDramaUsedThisMonth}，配额${credit.shortDramaQuota}`);
  }
  
  // 验证交易记录一致性
  const totalCredits = await prisma.pointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  
  // 计算应该有的积分（初始+充值+奖励-消费）
  const expectedPoints = (totalCredits._sum.amount || 0);
  const actualPoints = credit.points + credit.monthlyPoints;
  
  if (expectedPoints !== actualPoints) {
    warnings.push(`交易记录与积分余额不一致: 预期${expectedPoints}, 实际${actualPoints}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * =====================================================
 * 常量和配置导出
 * =====================================================
 */

// 重新导出重要的常量
export { LOCKED_MULTIPLIERS, QUOTA_LIMITS, QUOTA_CONFIGS };

/**
 * 积分系统版本信息
 */
export const POINTS_SYSTEM_VERSION = '1.0.0';
export const POINTS_SYSTEM_NAME = 'DUALAIHUB积分结算核心系统';

/**
 * 系统特性
 */
export const SYSTEM_FEATURES = {
  NO_OVERDRAFT: true,       // 无透支
  NO_DEBT: true,            // 无债务
  NO_CREDIT: true,          // 无信用
  POINTS_PERMANENT: true,   // 积分永不过期
  STRICT_CHECK: true,       // 严格余额检查
  ATOMIC_OPERATIONS: true,  // 原子操作
  LOCKED_MULTIPLIERS: true, // 锁定倍率
} as const;