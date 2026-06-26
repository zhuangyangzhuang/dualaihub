/**
 * Zhipu AI Integration - China's leading LLM from智谱AI
 * Strong in Chinese text, reasoning, and image understanding
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface ZhipuConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | { type: string; image_url?: string; text?: string }[];
}

interface ZhipuResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: { message: string; code: string };
}

interface ZhipuImageResponse {
  data: Array<{ url: string }>;
}

// ============================================================================
// Configuration
// ============================================================================

const ZHIPU_CONFIG: ZhipuConfig = {
  apiKey: process.env.ZHIPU_API_KEY || '',
  baseUrl: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
  model: process.env.ZHIPU_MODEL || 'glm-4',
  maxTokens: 8192,
  temperature: 0.7,
};

class ZhipuAPIClient {
  private config: ZhipuConfig;
  constructor(config: Partial<ZhipuConfig> = {}) {
    this.config = { ...ZHIPU_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('ZHIPU_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Zhipu API error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async chat(request: { model?: string; messages: ZhipuMessage[]; temperature?: number; max_tokens?: number }): Promise<ZhipuResponse> {
    return this.request<ZhipuResponse>('/chat/completions', request);
  }

  async imageGeneration(request: { model?: string; prompt: string; n?: number; size?: string }): Promise<ZhipuImageResponse> {
    return this.request<ZhipuImageResponse>('/images/generations', request);
  }
}

const zhipuClient = new ZhipuAPIClient();

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const messages: ZhipuMessage[] = [{ role: 'user', content: request.prompt }];
    if (request.options?.systemPrompt) messages.unshift({ role: 'system', content: request.options.systemPrompt as string });
    const response = await zhipuClient.chat({
      model: request.model || ZHIPU_CONFIG.model,
      messages,
      temperature: request.temperature ?? ZHIPU_CONFIG.temperature,
      max_tokens: request.maxTokens ?? ZHIPU_CONFIG.maxTokens,
    });
    if (response.error) return { success: false, error: response.error.message, provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { content: response.choices[0]?.message?.content || '', usage: response.usage }, provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = 'You are an expert programmer. Write clean, efficient, well-commented code.';
    const messages: ZhipuMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: request.prompt }];
    const response = await zhipuClient.chat({ model: 'glm-4-code', messages, temperature: 0.3, max_tokens: 16000 });
    return { success: true, data: { content: response.choices[0]?.message?.content || '' }, provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function image(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await zhipuClient.imageGeneration({ prompt: request.prompt, n: 1, size: '1024x1024' });
    return { success: true, data: { imageUrls: response.data.map(d => d.url) }, provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'zhipu', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function video(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Zhipu does not support video generation. Use Pika or Sora for creative video.', provider: 'zhipu', latencyMs: 0, timestamp: Date.now() };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Zhipu does not support music generation.', provider: 'zhipu', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await zhipuClient.chat({ model: ZHIPU_CONFIG.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 });
    return { provider: 'zhipu', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'zhipu', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const zhipuAI: AIProvider = { text, code, image, video, music, healthCheck };

export class ZhipuProvider {
  private client: ZhipuAPIClient;
  constructor(config?: Partial<ZhipuConfig>) { this.client = new ZhipuAPIClient(config); }
  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return text({ prompt, ...options }); }
  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return code({ prompt, ...options }); }
}

export { zhipuClient, ZHIPU_CONFIG };
export type { ZhipuConfig, ZhipuMessage, ZhipuResponse };
