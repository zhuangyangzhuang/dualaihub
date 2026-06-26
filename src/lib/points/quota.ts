/**
 * 会员配额管理系统
 * 
 * 定义不同会员等级的配额和使用限制
 */

import { Plan } from '@prisma/client';
import { ServiceType } from './pricing';

// 会员配额配置接口
export interface QuotaConfig {
  plan: Plan;
  name: string;
  monthlyPrice: number;           // 月费（美元）
  monthlyPoints: number;          // 每月自动发放积分
  shortDramaQuota: number;        // 每月免费短剧配额
  
  // 服务限制
  allowHighEndText: boolean;      // 是否允许高端文本模型
  allowHighEndImage: boolean;      // 是否允许高端图像模型
  allowVideo: boolean;             // 是否允许视频生成
  allowShortDrama: boolean;        // 是否允许AI短剧
  
  // 每日限制
  dailyTrialPoints: number;        // 每日试用积分（FREE用户）
  
  // 描述
  features: string[];
}

/**
 * =====================================================
 * 会员配额配置表
 * =====================================================
 */
export const QUOTA_CONFIGS: Record<Plan, QuotaConfig> = {
  // FREE - 免费用户
  FREE: {
    plan: 'FREE',
    name: '免费版',
    monthlyPrice: 0,
    monthlyPoints: 0,
    shortDramaQuota: 0,
    
    allowHighEndText: false,
    allowHighEndImage: false,
    allowVideo: false,
    allowShortDrama: false,
    
    dailyTrialPoints: 5,  // 每日5点试用积分
    
    features: [
      '仅限国内基础AI模型',
      'OpenRouter免费轻量文本模型',
      '禁止所有高端绘图',
      '禁止所有视频生成',
      '禁止AI短剧功能',
      '每日5点试用积分',
    ],
  },

  // BASIC - 基础会员
  BASIC: {
    plan: 'BASIC',
    name: '基础版',
    monthlyPrice: 7.99,
    monthlyPoints: 300,
    shortDramaQuota: 3,  // 每月3次免费短剧
    
    allowHighEndText: false,
    allowHighEndImage: false,
    allowVideo: true,
    allowShortDrama: true,
    
    dailyTrialPoints: 0,
    
    features: [
      '每月自动300积分',
      '无限制基础文本对话',
      '无限制基础绘图',
      '每月3次免费AI短剧',
      '短剧超出/高端模型自动扣积分',
      '支持标清视频生成',
    ],
  },

  // PRO - 专业版
  PRO: {
    plan: 'PRO',
    name: '专业版',
    monthlyPrice: 19.99,
    monthlyPoints: 1200,
    shortDramaQuota: 30,  // 每月30次免费短剧
    
    allowHighEndText: true,
    allowHighEndImage: true,
    allowVideo: true,
    allowShortDrama: true,
    
    dailyTrialPoints: 0,
    
    features: [
      '每月自动1200积分',
      '无限制高端文本模型（GPT-4o, Claude-3.5等）',
      '无限制高端绘图（Midjourney, Flux等）',
      '每月30次免费AI短剧',
      '超出自动扣积分',
      '支持高清视频生成',
      '优先队列处理',
    ],
  },

  // BUSINESS - 商业版
  BUSINESS: {
    plan: 'BUSINESS',
    name: '商业版',
    monthlyPrice: 49.99,
    monthlyPoints: 4000,
    shortDramaQuota: 100,  // 每月100次免费短剧
    
    allowHighEndText: true,
    allowHighEndImage: true,
    allowVideo: true,
    allowShortDrama: true,
    
    dailyTrialPoints: 0,
    
    features: [
      '每月自动4000积分',
      '所有顶级模型无限制',
      '高清AI短剧+特效',
      '每月100次免费AI短剧',
      '最高优先级处理',
      '专属API访问',
      '企业级支持',
    ],
  },
};

/**
 * 获取会员配额配置
 */
export function getQuotaConfig(plan: Plan): QuotaConfig {
  return QUOTA_CONFIGS[plan];
}

/**
 * 检查服务是否对会员等级可用
 */
export function isServiceAllowedForPlan(
  serviceType: ServiceType,
  plan: Plan
): { allowed: boolean; reason: string } {
  const config = QUOTA_CONFIGS[plan];

  switch (serviceType) {
    case ServiceType.TEXT_BASIC:
    case ServiceType.OPENROUTER_FREE:
      return { allowed: true, reason: '' };

    case ServiceType.TEXT_HIGH_END:
      if (!config.allowHighEndText) {
        return {
          allowed: false,
          reason: `您的${config.name}不支持高端文本模型，请升级至PRO或BUSINESS会员`,
        };
      }
      return { allowed: true, reason: '' };

    case ServiceType.IMAGE_BASIC:
      return { allowed: true, reason: '' };

    case ServiceType.IMAGE_HIGH_END:
      if (!config.allowHighEndImage) {
        return {
          allowed: false,
          reason: `您的${config.name}不支持高端图像生成，请升级至PRO或BUSINESS会员`,
        };
      }
      return { allowed: true, reason: '' };

    case ServiceType.VIDEO_BASIC:
    case ServiceType.VIDEO_HD:
      if (!config.allowVideo) {
        return {
          allowed: false,
          reason: `您的${config.name}不支持视频生成，请升级至BASIC或更高级会员`,
        };
      }
      return { allowed: true, reason: '' };

    case ServiceType.SHORT_DRAMA_BASIC:
    case ServiceType.SHORT_DRAMA_HD:
      if (!config.allowShortDrama) {
        return {
          allowed: false,
          reason: `您的${config.name}不支持AI短剧功能，请升级会员`,
        };
      }
      return { allowed: true, reason: '' };

    default:
      return { allowed: false, reason: '未知服务类型' };
  }
}

/**
 * 检查是否需要扣减积分（vs使用免费配额）
 */
export function shouldDeductPoints(
  serviceType: ServiceType,
  plan: Plan,
  hasQuotaRemaining: boolean
): boolean {
  const config = QUOTA_CONFIGS[plan];

  // 短剧服务：如果有免费配额剩余，先使用配额
  if (
    (serviceType === ServiceType.SHORT_DRAMA_BASIC ||
      serviceType === ServiceType.SHORT_DRAMA_HD) &&
    hasQuotaRemaining
  ) {
    return false; // 不扣积分，使用配额
  }

  // FREE用户的特殊处理
  if (plan === 'FREE') {
    // FREE用户只能使用OpenRouter免费模型或基础文本
    if (
      serviceType === ServiceType.OPENROUTER_FREE ||
      serviceType === ServiceType.TEXT_BASIC
    ) {
      return false; // 免费服务不扣积分
    }
    // 其他服务需要积分（但FREE用户本来就不能用）
    return true;
  }

  // BASIC及以上会员的基础服务不扣积分
  if (
    serviceType === ServiceType.TEXT_BASIC ||
    serviceType === ServiceType.IMAGE_BASIC
  ) {
    return false;
  }

  // 高端服务和超出配额的短剧需要扣积分
  return true;
}

/**
 * 获取会员等级的定价
 */
export function getPlanPrice(plan: Plan): number {
  return QUOTA_CONFIGS[plan].monthlyPrice;
}

/**
 * 比较会员等级
 * @returns 正数表示plan1更高，负数表示plan2更高，0表示相同
 */
export function comparePlans(plan1: Plan, plan2: Plan): number {
  const tiers: Plan[] = ['FREE', 'BASIC', 'PRO', 'BUSINESS'];
  return tiers.indexOf(plan1) - tiers.indexOf(plan2);
}

/**
 * 获取升级建议
 */
export function getUpgradeSuggestion(
  currentPlan: Plan,
  desiredService: ServiceType
): { suggestedPlan: Plan; message: string } | null {
  const tiers: Plan[] = ['FREE', 'BASIC', 'PRO', 'BUSINESS'];

  for (const plan of tiers) {
    if (comparePlans(plan, currentPlan) > 0) {
      const check = isServiceAllowedForPlan(desiredService, plan);
      if (check.allowed) {
        const config = QUOTA_CONFIGS[plan];
        return {
          suggestedPlan: plan,
          message: `升级至${config.name}（$${config.monthlyPrice}/月）即可使用此功能`,
        };
      }
    }
  }

  return null;
}

/**
 * 计算每日试用积分是否需要重置
 */
export function shouldResetDailyPoints(
  lastReset: Date,
  now: Date = new Date()
): boolean {
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
 * 计算月度积分是否需要重置
 */
export function shouldResetMonthlyQuota(
  lastReset: Date,
  now: Date = new Date()
): boolean {
  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return lastResetMonth !== currentMonth || lastResetYear !== currentYear;
}

/**
 * 获取当月剩余天数
 */
export function getRemainingDaysInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

/**
 * 导出配额常量
 */
export const QUOTA_LIMITS = {
  FREE_DAILY_POINTS: 5,
  BASIC_MONTHLY_POINTS: 300,
  PRO_MONTHLY_POINTS: 1200,
  BUSINESS_MONTHLY_POINTS: 4000,
  
  BASIC_SHORT_DRAMA_QUOTA: 3,
  PRO_SHORT_DRAMA_QUOTA: 30,
  BUSINESS_SHORT_DRAMA_QUOTA: 100,
} as const;