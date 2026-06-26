/**
 * DUALAIHUB 点数结算系统统一导出
 * 整合所有点数相关配置和函数
 */

export * from './exchange-rate';
export * from './member-config';

// 扣费优先级
export const DEDUCTION_PRIORITY = {
  // 1. 会员月度免费视频次数优先
  MEMBER_QUOTA_FIRST: 1,
  // 2. 每日试用额度次之
  TRIAL_QUOTA_SECOND: 2,
  // 3. 账户点数最后
  POINTS_LAST: 3,
} as const;

// 风控配置
export const RISK_CONTROL = {
  // 严格禁止透支
  NO_OVERDRAFT: true,
  // 严格禁止欠费
  NO_DEBT: true,
  // 严格禁止超额度
  NO_OVER_LIMIT: true,
  // 实时余额检查
  REAL_TIME_CHECK: true,
  // 原子操作保证一致性
  ATOMIC_OPERATION: true,
} as const;

// ============================================
// 扣费检查函数
// ============================================
export interface DeductionCheckResult {
  canProceed: boolean;
  requiredPoints: number;
  currentBalance: number;
  shortDramaQuotaRemaining: number | null;
  trialRemaining: number;
  error?: string;
  errorCode?: 'INSUFFICIENT_POINTS' | 'QUOTA_EXCEEDED' | 'SERVICE_NOT_ALLOWED' | 'MODEL_NOT_ALLOWED';
}

export function checkDeduction(
  currentBalance: number,
  requiredPoints: number,
  shortDramaQuotaRemaining: number | null,
  trialRemaining: number,
  useShortDramaQuota: boolean = false
): DeductionCheckResult {
  // 如果使用短剧配额
  if (useShortDramaQuota && shortDramaQuotaRemaining !== null) {
    if (shortDramaQuotaRemaining > 0) {
      return {
        canProceed: true,
        requiredPoints: 0,
        currentBalance,
        shortDramaQuotaRemaining: shortDramaQuotaRemaining - 1,
        trialRemaining,
      };
    }
  }
  
  // 如果有试用额度
  if (trialRemaining > 0) {
    return {
      canProceed: true,
      requiredPoints: requiredPoints,
      currentBalance,
      shortDramaQuotaRemaining,
      trialRemaining: trialRemaining - 1,
    };
  }
  
  // 检查点数余额
  if (currentBalance < requiredPoints) {
    return {
      canProceed: false,
      requiredPoints,
      currentBalance,
      shortDramaQuotaRemaining,
      trialRemaining: 0,
      error: `积分不足。需要 ${requiredPoints} 点，当前余额 ${currentBalance} 点`,
      errorCode: 'INSUFFICIENT_POINTS',
    };
  }
  
  return {
    canProceed: true,
    requiredPoints,
    currentBalance: currentBalance - requiredPoints,
    shortDramaQuotaRemaining,
    trialRemaining: 0,
  };
}

// ============================================
// 服务权限检查
// ============================================
export interface ServiceCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: string;
}

export function checkServiceAccess(
  memberLevel: 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS',
  serviceType: 'text' | 'code' | 'image' | 'video' | 'shortDrama'
): ServiceCheckResult {
  const config = {
    FREE: { text: true, code: true, image: false, video: false, shortDrama: false },
    BASIC: { text: true, code: true, image: true, video: true, shortDrama: true },
    PRO: { text: true, code: true, image: true, video: true, shortDrama: true },
    BUSINESS: { text: true, code: true, image: true, video: true, shortDrama: true },
  };
  
  const allowed = config[memberLevel]?.[serviceType] ?? false;
  
  if (!allowed) {
    const requiredLevel = {
      text: 'FREE',
      code: 'FREE',
      image: 'BASIC',
      video: 'BASIC',
      shortDrama: 'BASIC',
    }[serviceType];
    
    return {
      allowed: false,
      reason: `该功能需要${requiredLevel}或更高级别会员`,
      requiredLevel,
    };
  }
  
  return { allowed: true };
}

// ============================================
// 模型权限检查
// ============================================
export function checkModelAccess(
  memberLevel: 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS',
  modelTier: 'free' | 'basic' | 'premium'
): ServiceCheckResult {
  const tierLevels: Record<string, 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS'> = {
    free: 'FREE',
    basic: 'BASIC',
    premium: 'PRO',
  };
  
  const requiredLevel = tierLevels[modelTier];
  const levelOrder = { FREE: 0, BASIC: 1, PRO: 2, BUSINESS: 3 };
  
  if (levelOrder[memberLevel] >= levelOrder[requiredLevel]) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `该模型需要${requiredLevel}或更高级别会员`,
    requiredLevel,
  };
}
