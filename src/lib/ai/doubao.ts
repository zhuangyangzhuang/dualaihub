/**
 * Doubao AI Integration - ByteDance's AI assistant
 * Strong in Chinese text, image generation, and video understanding
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface DoubaoConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DoubaoResponse {
  code: number;
  message: string;
  data?: {
    choices: Array<{
      message: { role: string; content: string };
      finish_reason: string;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    id: string;
  };
}

interface DoubaoImageResponse {
  code: number;
  message: string;
  data?: { image_urls: string[] };
}

// ============================================================================
// Configuration
// ============================================================================

const DOUBAO_CONFIG: DoubaoConfig = {
  apiKey: process.env.DOUBAO_API_KEY || '',
  baseUrl: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  model: process.env.DOUBAO_MODEL || 'doubao-pro',
  maxTokens: 8192,
  temperature: 0.7,
};

class DoubaoAPIClient {
  private config: DoubaoConfig;
  constructor(config: Partial<DoubaoConfig> = {}) {
    this.config = { ...DOUBAO_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('DOUBAO_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Doubao API error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async chat(request: { model?: string; messages: DoubaoMessage[]; temperature?: number; max_tokens?: number }): Promise<DoubaoResponse> {
    return this.request<DoubaoResponse>('/chat/completions', request);
  }

  async imageGeneration(request: { prompt: string; image_size?: string; num_images?: number }): Promise<DoubaoImageResponse> {
    return this.request<DoubaoImageResponse>('/images/generations', request);
  }
}

const doubaoClient = new DoubaoAPIClient();

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const messages: DoubaoMessage[] = [{ role: 'user', content: request.prompt }];
    if (request.options?.systemPrompt) messages.unshift({ role: 'system', content: request.options.systemPrompt as string });
    const response = await doubaoClient.chat({
      model: request.model || DOUBAO_CONFIG.model,
      messages,
      temperature: request.temperature ?? DOUBAO_CONFIG.temperature,
      max_tokens: request.maxTokens ?? DOUBAO_CONFIG.maxTokens,
    });
    if (response.code !== 0) return { success: false, error: response.message, provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { content: response.data?.choices[0]?.message?.content || '', usage: response.data?.usage }, provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = 'You are an expert programmer. Write clean, efficient, production-ready code.';
    const messages: DoubaoMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: request.prompt }];
    const response = await doubaoClient.chat({ model: 'doubao-pro-32k', messages, temperature: 0.3, max_tokens: 16000 });
    return { success: true, data: { content: response.data?.choices[0]?.message?.content || '' }, provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function image(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await doubaoClient.imageGeneration({ prompt: request.prompt, num_images: 1 });
    if (response.code !== 0) return { success: false, error: response.message, provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { imageUrls: response.data?.image_urls || [] }, provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'doubao', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function video(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Doubao does not support video generation directly. Use Pika or Sora for creative video.', provider: 'doubao', latencyMs: 0, timestamp: Date.now() };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Doubao does not support music generation.', provider: 'doubao', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await doubaoClient.chat({ model: DOUBAO_CONFIG.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 });
    return { provider: 'doubao', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'doubao', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const doubaoAI: AIProvider = { text, code, image, video, music, healthCheck };

export class DoubaoProvider {
  private client: DoubaoAPIClient;
  constructor(config?: Partial<DoubaoConfig>) { this.client = new DoubaoAPIClient(config); }
  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return text({ prompt, ...options }); }
  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return code({ prompt, ...options }); }
  async image(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return image({ prompt, ...options }); }
}

export { doubaoClient, DOUBAO_CONFIG };
export type { DoubaoConfig, DoubaoMessage, DoubaoResponse };
