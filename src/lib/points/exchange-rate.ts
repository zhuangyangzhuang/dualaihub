/**
 * DUALAIHUB 全局点数兑换比例配置
 * 底层锁死，不可篡改
 * 
 * 标准兑换比例: 1美元 = 50点数
 * 单价换算: 1点数 = 0.02美元
 */

// ============================================
// 全局固定兑换比例 (底层锁死)
// ============================================
export const POINTS_EXCHANGE_RATE = {
  /** 1美元可兑换的点数 */
  DOLLARS_PER_POINT: 0.02,        // 1点数 = $0.02
  POINTS_PER_DOLLAR: 50,          // $1 = 50点数
  
  /** 最小充值金额 (美元) */
  MIN_RECHARGE: 1,
  
  /** 点数永久有效标志 */
  POINTS_NEVER_EXPIRE: true,
  POINTS_NEVER_RESET: true,
  POINTS_CUMULATIVE: true,
} as const;

// ============================================
// 前台固定充值套餐 (页面展示)
// ============================================
export const POINTS_PACKAGES = [
  {
    id: 'basic',
    points: 100,
    price: 1.99,
    label: '基础套餐',
    badge: null,
    perPoint: 0.0199,
    discount: 0,
  },
  {
    id: 'standard',
    points: 300,
    price: 4.99,
    label: '标准套餐',
    badge: '热门',
    perPoint: 0.0166,
    discount: 17,
  },
  {
    id: 'premium',
    points: 1200,
    price: 16.99,
    label: '超值套餐',
    badge: '17%off',
    perPoint: 0.0142,
    discount: 29,
  },
  {
    id: 'ultimate',
    points: 4000,
    price: 45.99,
    label: '终极套餐',
    badge: '最佳价值',
    perPoint: 0.0115,
    discount: 43,
  },
] as const;

// ============================================
// 盈利倍率配置 (底层锁死)
// ============================================
export const LOCKED_PROFIT_MULTIPLIERS = {
  // 高端文字模型: 8倍倍率 (纯暴利)
  HIGH_END_TEXT: {
    multiplier: 8,
    locked: true,
    description: '高端文字模型倍率锁定',
    models: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'],
  },
  
  // 高端绘图模型: 12倍倍率
  HIGH_END_IMAGE: {
    multiplier: 12,
    locked: true,
    description: '高端绘图模型倍率锁定',
    models: ['midjourney', 'flux-pro', 'dall-e-3'],
  },
  
  // 普通短剧视频: 强制20倍倍率
  SHORT_DRAMA_BASIC: {
    multiplier: 20,
    locked: true,
    mandatory: true,
    description: '普通短剧倍率强制锁定(禁止调低)',
    models: ['pika', 'runway', 'keling-video'],
  },
  
  // 超清影视级短剧: 强制20倍倍率
  SHORT_DRAMA_PRO: {
    multiplier: 20,
    locked: true,
    mandatory: true,
    description: '超清短剧倍率强制锁定(禁止调低)',
    models: ['sora', 'ai-short-drama', 'pika-hd'],
  },
  
  // OpenRouter免费模型: 1倍倍率
  FREE_MODELS: {
    multiplier: 1,
    locked: true,
    description: '免费模型倍率(引流专用)',
    models: ['gpt-3.5-turbo', 'qwen-lite', 'kimi-basic'],
  },
} as const;

// ============================================
// AI模型精准点数扣费标准
// ============================================
export const MODEL_POINTS_COST = {
  // 文字模型
  text: {
    // 免费文字模型 (1倍倍率,引流用)
    free: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', points: 1, multiplier: 1, provider: 'openrouter' },
      { id: 'qwen-lite', name: '通义千问Lite', points: 1, multiplier: 1, provider: 'domestic' },
      { id: 'kimi-basic', name: 'Kimi基础版', points: 1, multiplier: 1, provider: 'domestic' },
    ],
    // 基础文字模型 (无倍率要求)
    basic: [
      { id: 'doubao-pro', name: '豆包Pro', points: 1, multiplier: 2, provider: 'domestic' },
      { id: 'qwen-plus', name: '通义千问Plus', points: 1, multiplier: 2, provider: 'domestic' },
      { id: 'glm-4', name: '智谱GLM-4', points: 1, multiplier: 2, provider: 'domestic' },
    ],
    // 高端文字模型 (锁定8倍倍率,纯暴利)
    premium: [
      { id: 'gpt-4o', name: 'GPT-4o', points: 1, multiplier: 8, locked: true, provider: 'openrouter' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', points: 1, multiplier: 8, locked: true, provider: 'anthropic' },
      { id: 'gemini-pro', name: 'Gemini Pro', points: 1, multiplier: 8, locked: true, provider: 'google' },
    ],
  },
  
  // 代码模型
  code: {
    free: [
      { id: 'code-qwen-lite', name: '通义coderLite', points: 1, multiplier: 1, provider: 'domestic' },
      { id: 'gpt-3.5-code', name: 'GPT-3.5代码版', points: 1, multiplier: 1, provider: 'openrouter' },
    ],
    basic: [
      { id: 'code-qwen', name: '通义coder', points: 1, multiplier: 3, provider: 'domestic' },
      { id: 'kimi-code', name: 'Kimi代码版', points: 1, multiplier: 3, provider: 'domestic' },
    ],
    premium: [
      { id: 'gpt-4-code', name: 'GPT-4代码版', points: 2, multiplier: 8, locked: true, provider: 'openrouter' },
      { id: 'claude-code', name: 'Claude Code', points: 2, multiplier: 8, locked: true, provider: 'anthropic' },
    ],
  },
  
  // 绘图模型
  image: {
    free: [
      { id: 'stable-diffusion', name: 'Stable Diffusion', points: 1, multiplier: 1, provider: 'openrouter' },
      { id: 'wenxin-image', name: '文心一格', points: 1, multiplier: 1, provider: 'domestic' },
    ],
    basic: [
      { id: 'dall-e', name: 'DALL-E', points: 1, multiplier: 5, provider: 'openai' },
      { id: 'keling-image', name: '可灵AI绘图', points: 1, multiplier: 5, provider: 'domestic' },
    ],
    // 高端绘图模型 (锁定12倍倍率)
    premium: [
      { id: 'midjourney', name: 'Midjourney', points: 2, multiplier: 12, locked: true, provider: 'midjourney' },
      { id: 'flux-pro', name: 'Flux Pro', points: 2, multiplier: 12, locked: true, provider: 'black-forest' },
      { id: 'dall-e-3', name: 'DALL-E 3', points: 2, multiplier: 12, locked: true, provider: 'openai' },
    ],
  },
  
  // 视频/短剧模型
  video: {
    // 普通短剧视频 (10-15秒,强制20倍倍率)
    basic: [
      { id: 'pika', name: 'Pika', points: 60, multiplier: 20, locked: true, mandatory: true, duration: '10-15s', provider: 'pika' },
      { id: 'runway', name: 'Runway', points: 60, multiplier: 20, locked: true, mandatory: true, duration: '10-15s', provider: 'runway' },
      { id: 'keling-video', name: '可灵AI视频', points: 60, multiplier: 20, locked: true, mandatory: true, duration: '10-15s', provider: 'keling' },
    ],
    // 超清影视级短剧 (15-25秒,强制20倍倍率)
    premium: [
      { id: 'sora', name: 'Sora', points: 180, multiplier: 20, locked: true, mandatory: true, duration: '15-25s', provider: 'openai' },
      { id: 'ai-short-drama', name: 'AI短剧制作', points: 180, multiplier: 20, locked: true, mandatory: true, duration: '15-25s', provider: 'internal' },
      { id: 'pika-hd', name: 'Pika HD', points: 180, multiplier: 20, locked: true, mandatory: true, duration: '15-25s', provider: 'pika' },
    ],
  },
  
  // 音乐模型
  music: {
    free: [
      { id: 'melody', name: 'Melody', points: 1, multiplier: 1, provider: 'domestic' },
      { id: 'mermaid', name: 'Mermaid', points: 1, multiplier: 1, provider: 'domestic' },
    ],
    basic: [
      { id: 'suno', name: 'Suno', points: 2, multiplier: 5, provider: 'suno' },
      { id: 'udio', name: 'Udio', points: 2, multiplier: 5, provider: 'udio' },
    ],
  },
} as const;

// ============================================
// 盈利计算函数
// ============================================
export function calculateProfit(costUSD: number, pointsCost: number, multiplier: number): {
  sellingPrice: number;
  profit: number;
  profitMargin: number;
} {
  const sellingPrice = costUSD * multiplier;
  const profit = sellingPrice - costUSD;
  const profitMargin = (profit / sellingPrice) * 100;
  
  return {
    sellingPrice: Math.round(sellingPrice * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 1) / 1,
  };
}

// ============================================
// 金额转点数
// ============================================
export function dollarsToPoints(dollars: number): number {
  return Math.floor(dollars * POINTS_EXCHANGE_RATE.POINTS_PER_DOLLAR);
}

// ============================================
// 点数转金额
// ============================================
export function pointsToDollars(points: number): number {
  return Math.round((points / POINTS_EXCHANGE_RATE.POINTS_PER_DOLLAR) * 100) / 100;
}

// ============================================
// 获取模型点数成本
// ============================================
export function getModelPointsCost(
  modelId: string,
  serviceType: 'text' | 'code' | 'image' | 'video' | 'music'
): number {
  const service = MODEL_POINTS_COST[serviceType] as any;
  if (!service) return 1;
  
  const tiers = ['free', 'basic', 'premium'] as const;
  for (const tier of tiers) {
    const models = service[tier];
    if (models && Array.isArray(models)) {
      const model = models.find((m: { id: string }) => m.id === modelId);
      if (model) return model.points;
    }
  }
  
  return 1; // 默认1点
}

// ============================================
// 获取模型倍率
// ============================================
export function getModelMultiplier(
  modelId: string,
  serviceType: 'text' | 'code' | 'image' | 'video' | 'music'
): number {
  const service = MODEL_POINTS_COST[serviceType] as any;
  if (!service) return 1;
  
  const tiers = ['free', 'basic', 'premium'] as const;
  for (const tier of tiers) {
    const models = service[tier];
    if (models && Array.isArray(models)) {
      const model = models.find((m: { id: string }) => m.id === modelId);
      if (model) return model.multiplier;
    }
  }
  
  return 1; // 默认1倍
}

// ============================================
// 检查倍率是否被锁定
// ============================================
export function isMultiplierLocked(
  modelId: string,
  serviceType: 'text' | 'code' | 'image' | 'video' | 'music'
): boolean {
  const service = MODEL_POINTS_COST[serviceType] as any;
  if (!service) return false;
  
  const tiers = ['free', 'basic', 'premium'] as const;
  for (const tier of tiers) {
    const models = service[tier];
    if (models && Array.isArray(models)) {
      const model = models.find((m: { id: string }) => m.id === modelId);
      if (model && (model as any).locked) return true;
    }
  }
  
  return false;
}

// ============================================
// 检查倍率是否强制锁定(视频类)
// ============================================
export function isMultiplierMandatoryLocked(
  modelId: string,
  serviceType: 'text' | 'code' | 'image' | 'video' | 'music'
): boolean {
  const service = MODEL_POINTS_COST[serviceType] as any;
  if (!service) return false;
  
  const tiers = ['free', 'basic', 'premium'] as const;
  for (const tier of tiers) {
    const models = service[tier];
    if (models && Array.isArray(models)) {
      const model = models.find((m: { id: string }) => m.id === modelId);
      if (model && (model as any).mandatory) return true;
    }
  }
  
  return false;
}
