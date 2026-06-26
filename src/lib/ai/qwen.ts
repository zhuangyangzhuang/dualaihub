/**
 * Qwen AI Integration - Alibaba Cloud's LLM
 * Strong in Chinese text, code, and reasoning
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface QwenConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: { message: string; type: string; code: string };
}

interface QwenImageResponse {
  data: Array<{ url: string; revised_prompt?: string }>;
}

// ============================================================================
// Configuration
// ============================================================================

const QWEN_CONFIG: QwenConfig = {
  apiKey: process.env.QWEN_API_KEY || '',
  baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: process.env.QWEN_MODEL || 'qwen-plus',
  maxTokens: 8192,
  temperature: 0.7,
};

class QwenAPIClient {
  private config: QwenConfig;
  constructor(config: Partial<QwenConfig> = {}) {
    this.config = { ...QWEN_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('QWEN_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Qwen API error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async chat(request: { model?: string; messages: QwenMessage[]; temperature?: number; max_tokens?: number }): Promise<QwenResponse> {
    return this.request<QwenResponse>('/chat/completions', request);
  }

  async imageGeneration(request: { model?: string; prompt: string; n?: number; size?: string }): Promise<QwenImageResponse> {
    return this.request<QwenImageResponse>('/images/generations', request);
  }
}

const qwenClient = new QwenAPIClient();

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const messages: QwenMessage[] = [{ role: 'user', content: request.prompt }];
    if (request.options?.systemPrompt) messages.unshift({ role: 'system', content: request.options.systemPrompt as string });
    const response = await qwenClient.chat({
      model: request.model || QWEN_CONFIG.model,
      messages,
      temperature: request.temperature ?? QWEN_CONFIG.temperature,
      max_tokens: request.maxTokens ?? QWEN_CONFIG.maxTokens,
    });
    if (response.error) return { success: false, error: response.error.message, provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { content: response.choices[0]?.message?.content || '', usage: response.usage }, provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = 'You are an expert programmer. Write clean, well-documented, production-ready code with proper error handling.';
    const messages: QwenMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: request.prompt }];
    const response = await qwenClient.chat({ model: 'qwen-coder-plus', messages, temperature: 0.3, max_tokens: 16000 });
    return { success: true, data: { content: response.choices[0]?.message?.content || '' }, provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function image(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await qwenClient.imageGeneration({ prompt: request.prompt, n: 1, size: '1024x1024' });
    return { success: true, data: { imageUrls: response.data.map(d => d.url) }, provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'qwen', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function video(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Qwen does not support video generation. Use Pika or Sora.', provider: 'qwen', latencyMs: 0, timestamp: Date.now() };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Qwen does not support music generation.', provider: 'qwen', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await qwenClient.chat({ model: QWEN_CONFIG.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 });
    return { provider: 'qwen', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'qwen', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const qwenAI: AIProvider = { text, code, image, video, music, healthCheck };

export class QwenProvider {
  private client: QwenAPIClient;
  constructor(config?: Partial<QwenConfig>) { this.client = new QwenAPIClient(config); }
  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return text({ prompt, ...options }); }
  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return code({ prompt, ...options }); }
}

export { qwenClient, QWEN_CONFIG };
export type { QwenConfig, QwenMessage, QwenResponse };
