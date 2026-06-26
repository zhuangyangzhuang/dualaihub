/**
 * Anthropic Claude Integration - Global AI provider
 * Strong in creative writing, analysis, and complex reasoning
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | { type: string; source?: { type: string; media_type: string; data: string }; text?: string }[];
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
  error?: { message: string; type: string };
}

interface AnthropicImageResponse {
  content: Array<{ type: string; source: { type: string; media_type: string; data: string } }>;
}

// ============================================================================
// Configuration
// ============================================================================

const ANTHROPIC_CONFIG: AnthropicConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
  model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
  maxTokens: 8192,
  temperature: 0.7,
};

class AnthropicAPIClient {
  private config: AnthropicConfig;
  constructor(config: Partial<AnthropicConfig> = {}) {
    this.config = { ...ANTHROPIC_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async messages(request: { model?: string; messages: AnthropicMessage[]; system?: string; temperature?: number; max_tokens?: number }): Promise<AnthropicResponse> {
    return this.request<AnthropicResponse>('/messages', request);
  }
}

const anthropicClient = new AnthropicAPIClient();

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const messages: AnthropicMessage[] = [{ role: 'user', content: request.prompt }];
    const response = await anthropicClient.messages({
      model: request.model || ANTHROPIC_CONFIG.model,
      messages,
      system: request.options?.systemPrompt as string,
      temperature: request.temperature ?? ANTHROPIC_CONFIG.temperature,
      max_tokens: request.maxTokens ?? ANTHROPIC_CONFIG.maxTokens,
    });
    if (response.error) return { success: false, error: response.error.message, provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    return { success: true, data: { content: response.content[0]?.text || '', usage: { prompt_tokens: response.usage.input_tokens, completion_tokens: response.usage.output_tokens } }, provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = 'You are an expert programmer. Write clean, efficient, well-documented code. Prioritize best practices and maintainability.';
    const messages: AnthropicMessage[] = [{ role: 'user', content: request.prompt }];
    const response = await anthropicClient.messages({ model: 'claude-3-5-sonnet-20240620', messages, system: systemPrompt, temperature: 0.3, max_tokens: 16000 });
    return { success: true, data: { content: response.content[0]?.text || '' }, provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function image(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    // Claude supports image understanding via base64
    if (request.imageUrl) {
      const base64Data = request.imageUrl.split(',')[1] || request.imageUrl;
      const mediaType = request.imageUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const messages: AnthropicMessage[] = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType as 'image/png' | 'image/jpeg', data: base64Data } }, { type: 'text', text: request.prompt }] }];
      const response = await anthropicClient.messages({ model: 'claude-3-5-sonnet-20240620', messages, max_tokens: 1024 });
      return { success: true, data: { content: response.content[0]?.text || '' }, provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    }
    return { success: false, error: 'Image URL required for image analysis', provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'claude', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function video(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Claude does not support video generation. Use Pika or Sora.', provider: 'claude', latencyMs: 0, timestamp: Date.now() };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Claude does not support music generation.', provider: 'claude', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await anthropicClient.messages({ model: ANTHROPIC_CONFIG.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 10 });
    return { provider: 'claude', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'claude', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const anthropicAI: AIProvider = { text, code, image, video, music, healthCheck };

export class AnthropicProvider {
  private client: AnthropicAPIClient;
  constructor(config?: Partial<AnthropicConfig>) { this.client = new AnthropicAPIClient(config); }
  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return text({ prompt, ...options }); }
  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return code({ prompt, ...options }); }
}

export { anthropicClient, ANTHROPIC_CONFIG };
export type { AnthropicConfig, AnthropicMessage, AnthropicResponse };
