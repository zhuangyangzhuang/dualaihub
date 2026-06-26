/**
 * DUALAIHUB 四级会员永久固化配置
 * 所有参数锁死，仅管理员后台可微调
 */

// ============================================
// 会员等级定义
// ============================================
export type MemberLevel = 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS';

export interface MemberConfig {
  level: MemberLevel;
  name: string;
  nameCN: string;
  price: number;
  priceYearly?: number;
  
  // 点数配置
  monthlyPoints: number;        // 每月自动到账点数
  dailyTrialPoints: number;     // 每日试用点数 (仅FREE)
  
  // 短剧/视频配额
  shortDramaQuota: number | null;  // null = 无限
  shortDramaQuotaDisplay: string;
  
  // 功能权限
  canUseText: boolean;
  canUseCode: boolean;
  canUseImage: boolean;
  canUseVideo: boolean;
  canUseShortDrama: boolean;
  canUsePremiumModels: boolean;
  hasAPIAccess: boolean;
  hasPriority: boolean;
  
  // 可用的模型等级
  allowedModelTiers: ('free' | 'basic' | 'premium')[];
  maxDailyRequests: number | null;
}

// ============================================
// 四级会员完整配置 (永久锁死)
// ============================================
export const MEMBER_CONFIGS: Record<MemberLevel, MemberConfig> = {
  // ========================================
  // Level 1: 免费用户 (FREE)
  // ========================================
  FREE: {
    level: 'FREE',
    name: 'Free',
    nameCN: '免费用户',
    price: 0,
    
    // 每日赠送基础体验点数
    monthlyPoints: 0,
    dailyTrialPoints: 5,
    
    // 永久禁用所有绘图、视频、短剧功能
    shortDramaQuota: 0,
    shortDramaQuotaDisplay: '不可用',
    
    // 功能权限
    canUseText: true,
    canUseCode: true,
    canUseImage: false,
    canUseVideo: false,
    canUseShortDrama: false,
    canUsePremiumModels: false,
    hasAPIAccess: false,
    hasPriority: false,
    
    // 仅国产免费AI + OpenRouter免费模型
    allowedModelTiers: ['free'],
    maxDailyRequests: 50,
  },
  
  // ========================================
  // Level 2: 基础会员 (BASIC) - $7.99/月
  // ========================================
  BASIC: {
    level: 'BASIC',
    name: 'Basic',
    nameCN: '基础会员',
    price: 7.99,
    priceYearly: 79.99,
    
    // 每月自动到账300点数
    monthlyPoints: 300,
    dailyTrialPoints: 0,
    
    // 每月3次免费短剧额度
    shortDramaQuota: 3,
    shortDramaQuotaDisplay: '3次/月',
    
    // 功能权限
    canUseText: true,
    canUseCode: true,
    canUseImage: true,
    canUseVideo: true,
    canUseShortDrama: true,
    canUsePremiumModels: false,
    hasAPIAccess: false,
    hasPriority: false,
    
    // 允许免费+基础模型
    allowedModelTiers: ['free', 'basic'],
    maxDailyRequests: null,
  },
  
  // ========================================
  // Level 3: 高级会员 (PRO) - $19.99/月
  // ========================================
  PRO: {
    level: 'PRO',
    name: 'Pro',
    nameCN: '高级会员',
    price: 19.99,
    priceYearly: 199.99,
    
    // 每月自动到账1200点数
    monthlyPoints: 1200,
    dailyTrialPoints: 0,
    
    // 每月30次免费短剧额度
    shortDramaQuota: 30,
    shortDramaQuotaDisplay: '30次/月',
    
    // 功能权限
    canUseText: true,
    canUseCode: true,
    canUseImage: true,
    canUseVideo: true,
    canUseShortDrama: true,
    canUsePremiumModels: true,
    hasAPIAccess: true,
    hasPriority: true,
    
    // 允许免费+基础+高级模型
    allowedModelTiers: ['free', 'basic', 'premium'],
    maxDailyRequests: null,
  },
  
  // ========================================
  // Level 4: 专业会员 (BUSINESS) - $49.99/月
  // ========================================
  BUSINESS: {
    level: 'BUSINESS',
    name: 'Business',
    nameCN: '专业会员',
    price: 49.99,
    priceYearly: 499.99,
    
    // 每月自动到账4000点数
    monthlyPoints: 4000,
    dailyTrialPoints: 0,
    
    // 无视频次数限制
    shortDramaQuota: null,
    shortDramaQuotaDisplay: '无限',
    
    // 功能权限
    canUseText: true,
    canUseCode: true,
    canUseImage: true,
    canUseVideo: true,
    canUseShortDrama: true,
    canUsePremiumModels: true,
    hasAPIAccess: true,
    hasPriority: true,
    
    // 允许全部模型
    allowedModelTiers: ['free', 'basic', 'premium'],
    maxDailyRequests: null,
  },
} as const;

// ============================================
// 会员等级排序
// ============================================
export const MEMBER_LEVELS: MemberLevel[] = ['FREE', 'BASIC', 'PRO', 'BUSINESS'];

// ============================================
// 获取会员配置
// ============================================
export function getMemberConfig(level: MemberLevel): MemberConfig {
  return MEMBER_CONFIGS[level];
}

// ============================================
// 获取会员显示名称
// ============================================
export function getMemberName(level: MemberLevel, locale: 'en' | 'zh' = 'zh'): string {
  const config = MEMBER_CONFIGS[level];
  return locale === 'zh' ? config.nameCN : config.name;
}

// ============================================
// 获取月度点数
// ============================================
export function getMonthlyPoints(level: MemberLevel): number {
  return MEMBER_CONFIGS[level].monthlyPoints;
}

// ============================================
// 获取短剧配额
// ============================================
export function getShortDramaQuota(level: MemberLevel): number | null {
  return MEMBER_CONFIGS[level].shortDramaQuota;
}

// ============================================
// 检查是否可以执行操作
// ============================================
export function canUseService(level: MemberLevel, service: 'text' | 'code' | 'image' | 'video' | 'shortDrama'): boolean {
  const config = MEMBER_CONFIGS[level];
  
  switch (service) {
    case 'text': return config.canUseText;
    case 'code': return config.canUseCode;
    case 'image': return config.canUseImage;
    case 'video': return config.canUseVideo;
    case 'shortDrama': return config.canUseShortDrama;
    default: return false;
  }
}

// ============================================
// 检查是否可以使用高级模型
// ============================================
export function canUsePremiumModels(level: MemberLevel): boolean {
  return MEMBER_CONFIGS[level].canUsePremiumModels;
}

// ============================================
// 检查模型是否对该会员可用
// ============================================
export function isModelAllowedForMember(
  level: MemberLevel,
  modelTier: 'free' | 'basic' | 'premium'
): boolean {
  return MEMBER_CONFIGS[level].allowedModelTiers.includes(modelTier);
}

// ============================================
// 获取会员特权列表
// ============================================
export function getMemberBenefits(level: MemberLevel, locale: 'en' | 'zh' = 'zh'): string[] {
  const config = MEMBER_CONFIGS[level];
  const benefits: string[] = [];
  
  if (locale === 'zh') {
    if (config.monthlyPoints > 0) {
      benefits.push(`每月${config.monthlyPoints}点自动到账`);
    }
    if (config.dailyTrialPoints > 0) {
      benefits.push(`每日${config.dailyTrialPoints}点试用额度`);
    }
    if (config.shortDramaQuota !== null) {
      benefits.push(`每月${config.shortDramaQuota}次免费短剧`);
    } else if (config.shortDramaQuota === null && level !== 'FREE') {
      benefits.push('无限短剧制作');
    }
    if (config.canUseImage) {
      benefits.push('图片生成功能');
    }
    if (config.canUseVideo) {
      benefits.push('视频生成功能');
    }
    if (config.canUsePremiumModels) {
      benefits.push('高级AI模型');
    }
    if (config.hasAPIAccess) {
      benefits.push('API访问权限');
    }
    if (config.hasPriority) {
      benefits.push('优先调用通道');
    }
  } else {
    if (config.monthlyPoints > 0) {
      benefits.push(`${config.monthlyPoints} points monthly`);
    }
    if (config.dailyTrialPoints > 0) {
      benefits.push(`${config.dailyTrialPoints} trial points daily`);
    }
    if (config.shortDramaQuota !== null) {
      benefits.push(`${config.shortDramaQuota} free short dramas/month`);
    } else if (config.shortDramaQuota === null && level !== 'FREE') {
      benefits.push('Unlimited short dramas');
    }
    if (config.canUseImage) {
      benefits.push('Image generation');
    }
    if (config.canUseVideo) {
      benefits.push('Video generation');
    }
    if (config.canUsePremiumModels) {
      benefits.push('Premium AI models');
    }
    if (config.hasAPIAccess) {
      benefits.push('API access');
    }
    if (config.hasPriority) {
      benefits.push('Priority processing');
    }
  }
  
  return benefits;
}
