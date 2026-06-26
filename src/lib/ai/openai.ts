/**
 * OpenAI GPT-4o Integration - Global AI provider
 * Strong in creative writing, complex reasoning, and code
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | { type: string; image_url?: { url: string }; text?: string }[];
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: { message: string; type: string; code: string };
}

interface OpenAIImageResponse {
  data: Array<{ url: string; revised_prompt?: string }>;
}

// ============================================================================
// Configuration
// ============================================================================

const OPENAI_CONFIG: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  maxTokens: 8192,
  temperature: 0.7,
};

class OpenAIAPIClient {
  private config: OpenAIConfig;
  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...OPENAI_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`OpenAI API error: ${response.status} - ${error.message || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async chat(request: { model?: string; messages: OpenAIMessage[]; temperature?: number; max_tokens?: number }): Promise<OpenAIResponse> {
    return this.request<OpenAIResponse>('/chat/completions', request);
  }

  async imageGeneration(request: { model?: string; prompt: string; n?: number; size?: string }): Promise<OpenAIImageResponse> {
    return this.request<OpenAIImageResponse>('/images/generations', request);
  }
}

const openaiClient = new OpenAIAPIClient();

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const messages: OpenAIMessage[] = [{ role: 'user', content: request.prompt }];
    if (request.options?.systemPrompt) messages.unshift({ role: 'system', content: request.options.systemPrompt as string });
    const response = await openaiClient.chat({
      model: request.model || OPENAI_CONFIG.model,
      messages,
      temperature: request.temperature ?? OPENAI_CONFIG.temperature,
      max_tokens: request.maxTokens ?? OPENAI_CONFIG.maxTokens,
    });
    if (response.error) return { success: false, error: response.error.message, provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { content: response.choices[0]?.message?.content || '', usage: response.usage }, provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = 'You are an expert programmer. Write clean, efficient, well-documented code. Prioritize readability and maintainability.';
    const messages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: request.prompt }];
    const response = await openaiClient.chat({ model: 'gpt-4o', messages, temperature: 0.3, max_tokens: 16000 });
    return { success: true, data: { content: response.choices[0]?.message?.content || '' }, provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function image(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await openaiClient.imageGeneration({ prompt: request.prompt, n: 1, size: '1024x1024' });
    return { success: true, data: { imageUrls: response.data.map(d => d.url) }, provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'gpt4o', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function video(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'GPT-4o does not support video generation. Use Pika or Sora.', provider: 'gpt4o', latencyMs: 0, timestamp: Date.now() };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'GPT-4o does not support music generation.', provider: 'gpt4o', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await openaiClient.chat({ model: OPENAI_CONFIG.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 });
    return { provider: 'gpt4o', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'gpt4o', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const openaiAI: AIProvider = { text, code, image, video, music, healthCheck };

export class OpenAIProvider {
  private client: OpenAIAPIClient;
  constructor(config?: Partial<OpenAIConfig>) { this.client = new OpenAIAPIClient(config); }
  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return text({ prompt, ...options }); }
  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return code({ prompt, ...options }); }
}

export { openaiClient, OPENAI_CONFIG };
export type { OpenAIConfig, OpenAIMessage, OpenAIResponse };
