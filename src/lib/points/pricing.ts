/**
 * 模型定价配置 - 锁定版本
 * 
 * 此文件定义了所有AI服务的最低积分倍率
 * 这些倍率是最低限制，不能降低
 */

// 服务类型枚举
export enum ServiceType {
  TEXT_BASIC = 'TEXT_BASIC',
  TEXT_HIGH_END = 'TEXT_HIGH_END',
  IMAGE_BASIC = 'IMAGE_BASIC',
  IMAGE_HIGH_END = 'IMAGE_HIGH_END',
  VIDEO_BASIC = 'VIDEO_BASIC',
  VIDEO_HD = 'VIDEO_HD',
  SHORT_DRAMA_BASIC = 'SHORT_DRAMA_BASIC',
  SHORT_DRAMA_HD = 'SHORT_DRAMA_HD',
  OPENROUTER_FREE = 'OPENROUTER_FREE',
}

// 模型分类
export enum ModelTier {
  FREE = 'FREE',           // 免费/基础模型
  BASIC = 'BASIC',         // 基础付费模型
  HIGH_END = 'HIGH_END',   // 高端模型
  PREMIUM = 'PREMIUM',     // 顶级模型
}

// 定价配置接口
export interface PricingConfig {
  serviceType: ServiceType;
  basePoints: number;           // 基础积分消耗
  minMultiplier: number;         // 最低倍率（锁定，不可降低）
  allowedPlans: string[];       // 允许使用的会员等级
  description: string;
  isLocked: boolean;            // 是否锁定（锁定的配置不可修改）
}

// 模型映射配置
export interface ModelMapping {
  modelId: string;              // 模型标识符
  modelName: string;            // 模型显示名称
  serviceType: ServiceType;
  tier: ModelTier;
  provider: string;             // 提供商
}

/**
 * =====================================================
 * 核心定价配置表（锁定）
 * =====================================================
 * 注意：minMultiplier 是最低限制，不能降低
 */

export const PRICING_CONFIG: Record<ServiceType, PricingConfig> = {
  // 基础文本服务
  [ServiceType.TEXT_BASIC]: {
    serviceType: ServiceType.TEXT_BASIC,
    basePoints: 1,
    minMultiplier: 1.0,  // 最低1倍
    allowedPlans: ['FREE', 'BASIC', 'PRO', 'BUSINESS'],
    description: '基础文本AI服务（GPT-3.5, Qwen-Turbo等）',
    isLocked: false,
  },

  // 高端文本服务 - 锁定最低8倍
  [ServiceType.TEXT_HIGH_END]: {
    serviceType: ServiceType.TEXT_HIGH_END,
    basePoints: 5,
    minMultiplier: 8.0,  // 锁定最低8倍倍率
    allowedPlans: ['BASIC', 'PRO', 'BUSINESS'],
    description: '高端文本AI（GPT-4o, Claude-3.5, Gemini Pro等）',
    isLocked: true,
  },

  // 基础图像服务
  [ServiceType.IMAGE_BASIC]: {
    serviceType: ServiceType.IMAGE_BASIC,
    basePoints: 2,
    minMultiplier: 1.0,
    allowedPlans: ['FREE', 'BASIC', 'PRO', 'BUSINESS'],
    description: '基础图像生成（Stable Diffusion等）',
    isLocked: false,
  },

  // 高端图像服务 - 锁定最低12倍
  [ServiceType.IMAGE_HIGH_END]: {
    serviceType: ServiceType.IMAGE_HIGH_END,
    basePoints: 8,
    minMultiplier: 12.0,  // 锁定最低12倍倍率
    allowedPlans: ['PRO', 'BUSINESS'],
    description: '高端图像生成（Midjourney, Flux等）',
    isLocked: true,
  },

  // 基础视频服务
  [ServiceType.VIDEO_BASIC]: {
    serviceType: ServiceType.VIDEO_BASIC,
    basePoints: 15,
    minMultiplier: 5.0,
    allowedPlans: ['BASIC', 'PRO', 'BUSINESS'],
    description: '基础视频生成（标清）',
    isLocked: false,
  },

  // 高清视频服务 - 锁定最低20倍
  [ServiceType.VIDEO_HD]: {
    serviceType: ServiceType.VIDEO_HD,
    basePoints: 30,
    minMultiplier: 20.0,  // 锁定最低20倍倍率
    allowedPlans: ['PRO', 'BUSINESS'],
    description: '高清视频生成（1080p+）',
    isLocked: true,
  },

  // AI短剧基础版 - 锁定最低20倍
  [ServiceType.SHORT_DRAMA_BASIC]: {
    serviceType: ServiceType.SHORT_DRAMA_BASIC,
    basePoints: 20,
    minMultiplier: 20.0,  // 锁定最低20倍倍率
    allowedPlans: ['BASIC', 'PRO', 'BUSINESS'],
    description: 'AI短剧生成基础版',
    isLocked: true,
  },

  // AI短剧高清版 - 锁定最低20倍
  [ServiceType.SHORT_DRAMA_HD]: {
    serviceType: ServiceType.SHORT_DRAMA_HD,
    basePoints: 50,
    minMultiplier: 20.0,  // 锁定最低20倍倍率，不可降低
    allowedPlans: ['BUSINESS'],
    description: 'AI短剧高清版（含特效）',
    isLocked: true,
  },

  // OpenRouter免费模型
  [ServiceType.OPENROUTER_FREE]: {
    serviceType: ServiceType.OPENROUTER_FREE,
    basePoints: 0,  // 完全免费
    minMultiplier: 1.0,
    allowedPlans: ['FREE', 'BASIC', 'PRO', 'BUSINESS'],
    description: 'OpenRouter免费轻量文本模型',
    isLocked: false,
  },
};

/**
 * 模型到服务类型的映射
 */
export const MODEL_MAPPINGS: ModelMapping[] = [
  // OpenAI 模型
  { modelId: 'gpt-3.5-turbo', modelName: 'GPT-3.5 Turbo', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'openai' },
  { modelId: 'gpt-4', modelName: 'GPT-4', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'openai' },
  { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'openai' },
  { modelId: 'gpt-4o', modelName: 'GPT-4o', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'openai' },
  { modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'openai' },
  
  // Anthropic 模型
  { modelId: 'claude-3-5-sonnet', modelName: 'Claude 3.5 Sonnet', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'anthropic' },
  { modelId: 'claude-3-opus', modelName: 'Claude 3 Opus', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.PREMIUM, provider: 'anthropic' },
  { modelId: 'claude-3-sonnet', modelName: 'Claude 3 Sonnet', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'anthropic' },
  { modelId: 'claude-3-haiku', modelName: 'Claude 3 Haiku', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'anthropic' },

  // Google 模型
  { modelId: 'gemini-pro', modelName: 'Gemini Pro', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'google' },
  { modelId: 'gemini-flash', modelName: 'Gemini Flash', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'google' },

  // 国产模型
  { modelId: 'qwen-turbo', modelName: '通义千问 Turbo', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'alibaba' },
  { modelId: 'qwen-plus', modelName: '通义千问 Plus', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'alibaba' },
  { modelId: 'qwen-max', modelName: '通义千问 Max', serviceType: ServiceType.TEXT_HIGH_END, tier: ModelTier.HIGH_END, provider: 'alibaba' },
  { modelId: 'kimi', modelName: 'Kimi', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'moonshot' },
  { modelId: 'doubao-pro', modelName: '豆包 Pro', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'bytedance' },
  { modelId: 'glm-4', modelName: 'GLM-4', serviceType: ServiceType.TEXT_BASIC, tier: ModelTier.BASIC, provider: 'zhipu' },

  // 图像模型
  { modelId: 'stable-diffusion', modelName: 'Stable Diffusion', serviceType: ServiceType.IMAGE_BASIC, tier: ModelTier.BASIC, provider: 'stability' },
  { modelId: 'dall-e-3', modelName: 'DALL-E 3', serviceType: ServiceType.IMAGE_HIGH_END, tier: ModelTier.HIGH_END, provider: 'openai' },
  { modelId: 'midjourney', modelName: 'Midjourney', serviceType: ServiceType.IMAGE_HIGH_END, tier: ModelTier.PREMIUM, provider: 'midjourney' },
  { modelId: 'flux-pro', modelName: 'Flux Pro', serviceType: ServiceType.IMAGE_HIGH_END, tier: ModelTier.HIGH_END, provider: 'black-forest' },

  // 视频模型
  { modelId: 'pika', modelName: 'Pika', serviceType: ServiceType.VIDEO_BASIC, tier: ModelTier.BASIC, provider: 'pika' },
  { modelId: 'pika-hd', modelName: 'Pika HD', serviceType: ServiceType.VIDEO_HD, tier: ModelTier.HIGH_END, provider: 'pika' },
  { modelId: 'sora', modelName: 'Sora', serviceType: ServiceType.VIDEO_HD, tier: ModelTier.PREMIUM, provider: 'openai' },
  { modelId: 'runway-gen3', modelName: 'Runway Gen-3', serviceType: ServiceType.VIDEO_HD, tier: ModelTier.HIGH_END, provider: 'runway' },

  // AI短剧
  { modelId: 'short-drama-basic', modelName: 'AI短剧基础版', serviceType: ServiceType.SHORT_DRAMA_BASIC, tier: ModelTier.BASIC, provider: 'internal' },
  { modelId: 'short-drama-hd', modelName: 'AI短剧高清版', serviceType: ServiceType.SHORT_DRAMA_HD, tier: ModelTier.PREMIUM, provider: 'internal' },
];

/**
 * 获取模型的服务类型配置
 */
export function getModelConfig(modelId: string): ModelMapping | undefined {
  return MODEL_MAPPINGS.find(m => m.modelId === modelId);
}

/**
 * 获取服务的定价配置
 */
export function getServicePricing(serviceType: ServiceType): PricingConfig {
  return PRICING_CONFIG[serviceType];
}

/**
 * 计算模型所需积分
 * @param modelId 模型标识符
 * @param inputTokens 输入token数（可选）
 * @param outputTokens 输出token数（可选）
 * @returns 所需积分
 */
export function calculateRequiredPoints(
  modelId: string,
  inputTokens?: number,
  outputTokens?: number
): number {
  const modelConfig = getModelConfig(modelId);
  
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const pricing = getServicePricing(modelConfig.serviceType);
  
  // 基础积分
  let points = pricing.basePoints;

  // 如果有token信息，按比例调整（仅文本模型）
  if (inputTokens && outputTokens && 
      (modelConfig.serviceType === ServiceType.TEXT_BASIC || 
       modelConfig.serviceType === ServiceType.TEXT_HIGH_END)) {
    // 基于token数量调整积分
    // 基准：1K输入 + 1K输出 = basePoints
    const totalTokens = (inputTokens + outputTokens) / 1000;
    points = Math.ceil(pricing.basePoints * totalTokens);
  }

  // 应用最低倍率（锁定，确保不会亏损）
  const minPoints = Math.ceil(pricing.basePoints * pricing.minMultiplier);
  
  return Math.max(points, minPoints);
}

/**
 * 检查会员等级是否有权使用该服务
 */
export function canUseService(serviceType: ServiceType, userPlan: string): boolean {
  const pricing = getServicePricing(serviceType);
  return pricing.allowedPlans.includes(userPlan);
}

/**
 * 获取用户可用的所有服务类型
 */
export function getAvailableServices(userPlan: string): ServiceType[] {
  return Object.values(ServiceType).filter(serviceType => 
    canUseService(serviceType, userPlan)
  );
}

/**
 * 获取锁定配置列表（用于审计）
 */
export function getLockedPricingConfigs(): PricingConfig[] {
  return Object.values(PRICING_CONFIG).filter(config => config.isLocked);
}

/**
 * 验证倍率修改是否合法
 * 锁定配置的倍率只能增加，不能降低
 */
export function validateMultiplierChange(
  serviceType: ServiceType,
  newMultiplier: number
): { valid: boolean; message: string } {
  const pricing = getServicePricing(serviceType);
  
  if (pricing.isLocked && newMultiplier < pricing.minMultiplier) {
    return {
      valid: false,
      message: `服务 ${serviceType} 的倍率已锁定，最低为 ${pricing.minMultiplier}，不能降低到 ${newMultiplier}`,
    };
  }
  
  return { valid: true, message: '' };
}

// 导出定价常量（便于其他模块引用）
export const LOCKED_MULTIPLIERS = {
  TEXT_HIGH_END: 8.0,
  IMAGE_HIGH_END: 12.0,
  VIDEO_HD: 20.0,
  SHORT_DRAMA: 20.0,  // 短剧最低20倍，不可降低
} as const;