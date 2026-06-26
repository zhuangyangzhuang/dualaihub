/**
 * Dual AI Scheduler - Routes tasks between Chinese and Global AI providers
 * 
 * Realistic tasks (video/portrait/text/code) → Chinese AI (Kimi, Doubao, Qwen, Zhipu)
 * Creative/artistic tasks → Global AI (GPT-4o, Claude, Pika, Sora)
 */

import { kimiAI, KimiProvider } from './kimi';
import { doubaoAI, DoubaoProvider } from './doubao';
import { qwenAI, QwenProvider } from './qwen';
import { zhipuAI, ZhipuProvider } from './zhipu';
import { openaiAI, OpenAIProvider } from './openai';
import { anthropicAI, AnthropicProvider } from './anthropic';
import { pikaAI, PikaProvider } from './pika';
import { soraAI, SoraProvider } from './sora';

// ============================================================================
// Types
// ============================================================================

export type TaskType = 'text' | 'code' | 'image' | 'video' | 'music';

export type AIVendor = 'chinese' | 'global';

export type ChineseProvider = 'kimi' | 'doubao' | 'qwen' | 'zhipu';
export type GlobalProvider = 'gpt4o' | 'claude' | 'pika' | 'sora';

export interface AIRequest<T = unknown> {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  options?: Record<string, unknown>;
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  latencyMs: number;
  timestamp: number;
}

export interface HealthStatus {
  provider: string;
  healthy: boolean;
  latencyMs: number;
  lastCheck: number;
  consecutiveFailures: number;
}

export interface SchedulerConfig {
  enableHealthMonitoring: boolean;
  healthCheckIntervalMs: number;
  maxConsecutiveFailures: number;
  timeoutMs: number;
  enableRoundRobin: boolean;
}

// ============================================================================
// Provider Registry
// ============================================================================

export type AIProvider = {
  text: (request: AIRequest) => Promise<AIResponse>;
  code: (request: AIRequest) => Promise<AIResponse>;
  image: (request: AIRequest) => Promise<AIResponse>;
  video: (request: AIRequest) => Promise<AIResponse>;
  music: (request: AIRequest) => Promise<AIResponse>;
  healthCheck: () => Promise<HealthStatus>;
};

interface ProviderRegistry {
  kimi: { instance: AIProvider; weight: number };
  doubao: { instance: AIProvider; weight: number };
  qwen: { instance: AIProvider; weight: number };
  zhipu: { instance: AIProvider; weight: number };
  gpt4o: { instance: AIProvider; weight: number };
  claude: { instance: AIProvider; weight: number };
  pika: { instance: AIProvider; weight: number };
  sora: { instance: AIProvider; weight: number };
}

const chineseProviders: ChineseProvider[] = ['kimi', 'doubao', 'qwen', 'zhipu'];
const globalProviders: GlobalProvider[] = ['gpt4o', 'claude', 'pika', 'sora'];

// ============================================================================
// Health Monitoring
// ============================================================================

class HealthMonitor {
  private healthStatus: Map<string, HealthStatus> = new Map();
  private config: SchedulerConfig;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  async checkProviderHealth(provider: AIProvider, name: string): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const status = await provider.healthCheck();
      const latencyMs = Date.now() - start;
      return {
        provider: name,
        healthy: true,
        latencyMs,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
      };
    } catch {
      const latencyMs = Date.now() - start;
      const current = this.healthStatus.get(name);
      return {
        provider: name,
        healthy: false,
        latencyMs,
        lastCheck: Date.now(),
        consecutiveFailures: (current?.consecutiveFailures || 0) + 1,
      };
    }
  }

  updateHealth(status: HealthStatus): void {
    this.healthStatus.set(status.provider, status);
  }

  getHealthStatus(provider: string): HealthStatus | undefined {
    return this.healthStatus.get(provider);
  }

  getAllHealthStatus(): Map<string, HealthStatus> {
    return new Map(this.healthStatus);
  }

  isHealthy(provider: string): boolean {
    const status = this.healthStatus.get(provider);
    if (!status) return true;
    return status.healthy && status.consecutiveFailures < this.config.maxConsecutiveFailures;
  }

  startMonitoring(registry: ProviderRegistry): void {
    if (!this.config.enableHealthMonitoring) return;

    const checkAll = async () => {
      const checks = Object.entries(registry).map(async ([name, { instance }]) => {
        const status = await this.checkProviderHealth(instance, name);
        this.updateHealth(status);
      });
      await Promise.all(checks);
    };

    checkAll();
    this.checkInterval = setInterval(checkAll, this.config.healthCheckIntervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ============================================================================
// Round-Robin Load Balancer
// ============================================================================

class RoundRobinBalancer {
  private currentIndex: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();

  getNext(chinese: boolean): string {
    const providers = chinese ? chineseProviders : globalProviders;
    const key = chinese ? 'chinese' : 'global';
    
    const current = this.currentIndex.get(key) || 0;
    const counts = this.requestCounts.get(key) || 0;
    
    // Find next healthy provider
    let attempts = 0;
    let nextIndex = current;
    
    while (attempts < providers.length) {
      const provider = providers[nextIndex % providers.length];
      if (this.isProviderHealthy(provider)) {
        break;
      }
      nextIndex++;
      attempts++;
    }
    
    this.currentIndex.set(key, (nextIndex + 1) % providers.length);
    this.requestCounts.set(key, counts + 1);
    
    return providers[nextIndex % providers.length];
  }

  private isProviderHealthy(_provider: string): boolean {
    // This will be connected to health monitor in scheduler
    return true;
  }

  reset(): void {
    this.currentIndex.clear();
    this.requestCounts.clear();
  }

  getRequestCount(chinese: boolean): number {
    const key = chinese ? 'chinese' : 'global';
    return this.requestCounts.get(key) || 0;
  }
}

// ============================================================================
// Main Scheduler
// ============================================================================

class AIScheduler {
  private registry: ProviderRegistry;
  private healthMonitor: HealthMonitor;
  private roundRobin: RoundRobinBalancer;
  private config: SchedulerConfig;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      enableHealthMonitoring: config.enableHealthMonitoring ?? true,
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? 30000,
      maxConsecutiveFailures: config.maxConsecutiveFailures ?? 3,
      timeoutMs: config.timeoutMs ?? 30000,
      enableRoundRobin: config.enableRoundRobin ?? true,
    };

    this.registry = {
      kimi: { instance: kimiAI, weight: 1 },
      doubao: { instance: doubaoAI, weight: 1 },
      qwen: { instance: qwenAI, weight: 1 },
      zhipu: { instance: zhipuAI, weight: 1 },
      gpt4o: { instance: openaiAI, weight: 1 },
      claude: { instance: anthropicAI, weight: 1 },
      pika: { instance: pikaAI, weight: 1 },
      sora: { instance: soraAI, weight: 1 },
    };

    this.roundRobin = new RoundRobinBalancer();
    this.healthMonitor = new HealthMonitor(this.config);
    
    if (this.config.enableHealthMonitoring) {
      this.healthMonitor.startMonitoring(this.registry);
    }
  }

  /**
   * Determine if a task is realistic (Chinese AI) or creative (Global AI)
   */
  private classifyTask(prompt: string, taskType: TaskType): { vendor: AIVendor; type: TaskType } {
    const creativeKeywords = [
      'creative', 'artistic', 'imaginative', 'art', 'design', 'story',
      'animation', 'movie', 'film', 'music composition', 'song', 'melody',
      'poetry', 'illustration', 'concept art', 'character design', 'fantasy',
      'science fiction', 'sci-fi', 'unreal', 'imagine', 'dream'
    ];

    const realisticKeywords = [
      'realistic', 'photorealistic', 'portrait', 'photo', 'real photo',
      'document', 'analysis', 'report', 'business', 'technical', 'code',
      'data', 'research', 'information', ' factual', 'actual', '真实',
      '照片', '肖像', '文档', '分析', '报告', '代码', '技术'
    ];

    const lowerPrompt = prompt.toLowerCase();

    // Check for creative keywords
    const isCreative = creativeKeywords.some(kw => lowerPrompt.includes(kw));
    
    // Check for realistic keywords
    const isRealistic = realisticKeywords.some(kw => lowerPrompt.includes(kw));

    // Task type mapping
    if (taskType === 'video') {
      // Video tasks: Pika/Sora for creative, Doubao/Kimi for realistic
      return isCreative ? { vendor: 'global', type: taskType } : { vendor: 'chinese', type: taskType };
    }

    if (taskType === 'music') {
      // Music always goes to global (Pika for video with music, or specialized music AI)
      return { vendor: 'global', type: taskType };
    }

    if (taskType === 'image') {
      // Image tasks
      return isCreative ? { vendor: 'global', type: taskType } : { vendor: 'chinese', type: taskType };
    }

    if (taskType === 'code') {
      // Code tasks go to Chinese AI (Kimi, Qwen are strong in code)
      return { vendor: 'chinese', type: taskType };
    }

    // Default: text tasks
    // Chinese LLMs are strong in Chinese text tasks
    const hasChineseChars = /[\u4e00-\u9fff]/.test(prompt);
    if (hasChineseChars) {
      return { vendor: 'chinese', type: taskType };
    }

    // English text - creative content goes global, factual goes Chinese
    return isCreative ? { vendor: 'global', type: taskType } : { vendor: 'chinese', type: taskType };
  }

  /**
   * Get the next healthy provider using round-robin
   */
  private selectProvider(vendor: AIVendor): string {
    if (!this.config.enableRoundRobin) {
      // Random selection among healthy providers
      const providers = vendor === 'chinese' ? chineseProviders : globalProviders;
      const healthyProviders = providers.filter(p => this.healthMonitor.isHealthy(p));
      return healthyProviders.length > 0 
        ? healthyProviders[Math.floor(Math.random() * healthyProviders.length)]
        : providers[0];
    }

    const provider = this.roundRobin.getNext(vendor === 'chinese');
    if (this.healthMonitor.isHealthy(provider)) {
      return provider;
    }

    // Fallback: find any healthy provider
    const providers = vendor === 'chinese' ? chineseProviders : globalProviders;
    for (const p of providers) {
      if (this.healthMonitor.isHealthy(p)) {
        return p;
      }
    }

    // Last resort: return requested provider (failover will handle it)
    return provider;
  }

  /**
   * Execute task with failover
   */
  private async executeWithFailover(
    vendor: AIVendor,
    taskType: TaskType,
    request: AIRequest
  ): Promise<AIResponse> {
    const providers = vendor === 'chinese' ? [...chineseProviders] : [...globalProviders];
    let lastError: Error | null = null;

    for (const providerName of providers) {
      if (!this.healthMonitor.isHealthy(providerName)) {
        continue;
      }

      const { instance } = this.registry[providerName as keyof ProviderRegistry];
      const startTime = Date.now();

      try {
        const method = taskType as keyof Omit<AIProvider, 'healthCheck'>;
        if (typeof instance[method] !== 'function') {
          continue;
        }

        const response = await this.withTimeout(
          instance[method](request),
          this.config.timeoutMs
        ) as AIResponse;

        if (response.success) {
          return {
            ...response,
            provider: providerName,
            latencyMs: Date.now() - startTime,
          };
        }

        lastError = new Error(response.error || 'Unknown error');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Update health status
        const currentStatus = this.healthMonitor.getHealthStatus(providerName);
        if (currentStatus) {
          this.healthMonitor.updateHealth({
            ...currentStatus,
            consecutiveFailures: currentStatus.consecutiveFailures + 1,
            healthy: false,
          });
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'All providers failed',
      provider: 'none',
      latencyMs: 0,
      timestamp: Date.now(),
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timeout')), ms);
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Process an AI request with automatic routing
   */
  async process(request: AIRequest, taskType: TaskType = 'text'): Promise<AIResponse> {
    const { vendor, type } = this.classifyTask(request.prompt, taskType);
    return this.executeWithFailover(vendor, type, request);
  }

  /**
   * Force route to a specific provider
   */
  async routeTo(provider: ChineseProvider | GlobalProvider, request: AIRequest, taskType: TaskType): Promise<AIResponse> {
    const { instance } = this.registry[provider as keyof ProviderRegistry];
    const startTime = Date.now();
    const method = taskType as keyof Omit<AIProvider, 'healthCheck'>;

    try {
      if (typeof instance[method] !== 'function') {
        return {
          success: false,
          error: `Provider ${provider} does not support ${taskType}`,
          provider,
          latencyMs: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }

      return await this.withTimeout(instance[method](request), this.config.timeoutMs) as AIResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider,
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): Map<string, HealthStatus> {
    return this.healthMonitor.getAllHealthStatus();
  }

  /**
   * Get scheduler statistics
   */
  getStats(): {
    totalRequests: number;
    chineseRequests: number;
    globalRequests: number;
    providerStats: Record<string, number>;
  } {
    return {
      totalRequests: this.roundRobin.getRequestCount(true) + this.roundRobin.getRequestCount(false),
      chineseRequests: this.roundRobin.getRequestCount(true),
      globalRequests: this.roundRobin.getRequestCount(false),
      providerStats: {
        kimi: 0,
        doubao: 0,
        qwen: 0,
        zhipu: 0,
        gpt4o: 0,
        claude: 0,
        pika: 0,
        sora: 0,
      },
    };
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    this.healthMonitor.stopMonitoring();
    this.roundRobin.reset();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const aiScheduler = new AIScheduler();

// Re-export all providers for direct access
export {
  kimiAI,
  doubaoAI,
  qwenAI,
  zhipuAI,
  openaiAI,
  anthropicAI,
  pikaAI,
  soraAI,
};

// Re-export scheduler instance
export { aiScheduler as scheduler };
