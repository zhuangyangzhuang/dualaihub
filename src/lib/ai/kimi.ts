/**
 * Kimi AI Integration - Chinese LLM provider (Moonshot AI)
 * Strong in Chinese text, code, and reasoning tasks
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface KimiConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiChatRequest {
  model: string;
  messages: KimiMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface KimiChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

interface KimiEmbeddingRequest {
  model: string;
  input: string | string[];
}

interface KimiEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
}

// ============================================================================
// Configuration
// ============================================================================

const KIMI_CONFIG: KimiConfig = {
  apiKey: process.env.KIMI_API_KEY || '',
  baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
  model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
  maxTokens: 8192,
  temperature: 0.7,
};

// ============================================================================
// API Client
// ============================================================================

class KimiAPIClient {
  private config: KimiConfig;

  constructor(config: Partial<KimiConfig> = {}) {
    this.config = { ...KIMI_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error('KIMI_API_KEY is not configured');
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async chat(request: KimiChatRequest): Promise<KimiChatResponse> {
    return this.request<KimiChatResponse>('/chat/completions', request);
  }

  async embeddings(request: KimiEmbeddingRequest): Promise<KimiEmbeddingResponse> {
    return this.request<KimiEmbeddingResponse>('/embeddings', request);
  }
}

const kimiClient = new KimiAPIClient();

// ============================================================================
// Provider Implementation
// ============================================================================

async function text(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const messages: KimiMessage[] = [
      { role: 'user', content: request.prompt }
    ];

    if (request.options?.systemPrompt) {
      messages.unshift({ role: 'system', content: request.options.systemPrompt as string });
    }

    const response = await kimiClient.chat({
      model: request.model || KIMI_CONFIG.model!,
      messages,
      temperature: request.temperature ?? KIMI_CONFIG.temperature,
      max_tokens: request.maxTokens ?? KIMI_CONFIG.maxTokens,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
        provider: 'kimi',
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }

    return {
      success: true,
      data: {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        id: response.id,
      },
      provider: 'kimi',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: 'kimi',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

async function code(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are an expert programmer. Write clean, well-commented, production-ready code.
Focus on correctness, efficiency, and maintainability.`;

    const messages: KimiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.prompt }
    ];

    const response = await kimiClient.chat({
      model: 'moonshot-v1-32k', // 32k context for code tasks
      messages,
      temperature: 0.3, // Lower temperature for code
      max_tokens: 16000,
    });

    return {
      success: true,
      data: {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
      },
      provider: 'kimi',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: 'kimi',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

async function image(_request: AIRequest): Promise<AIResponse> {
  // Kimi (Moonshot) is primarily a text model
  // For image generation, route to Doubao or Zhipu
  return {
    success: false,
    error: 'Kimi does not support image generation. Use Doubao or Zhipu for image tasks.',
    provider: 'kimi',
    latencyMs: 0,
    timestamp: Date.now(),
  };
}

async function video(_request: AIRequest): Promise<AIResponse> {
  // Kimi (Moonshot) is primarily a text model
  // For video generation, route to Doubao or Pika/Sora
  return {
    success: false,
    error: 'Kimi does not support video generation. Use Doubao for realistic video or Pika/Sora for creative video.',
    provider: 'kimi',
    latencyMs: 0,
    timestamp: Date.now(),
  };
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return {
    success: false,
    error: 'Kimi does not support music generation.',
    provider: 'kimi',
    latencyMs: 0,
    timestamp: Date.now(),
  };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  
  try {
    await kimiClient.chat({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 10,
    });

    return {
      provider: 'kimi',
      healthy: true,
      latencyMs: Date.now() - start,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
    };
  } catch {
    return {
      provider: 'kimi',
      healthy: false,
      latencyMs: Date.now() - start,
      lastCheck: Date.now(),
      consecutiveFailures: 1,
    };
  }
}

// ============================================================================
// Provider Export
// ============================================================================

export const kimiAI: AIProvider = {
  text,
  code,
  image,
  video,
  music,
  healthCheck,
};

export class KimiProvider {
  private client: KimiAPIClient;

  constructor(config?: Partial<KimiConfig>) {
    this.client = new KimiAPIClient(config);
  }

  async text(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> {
    return text({ prompt, ...options });
  }

  async code(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> {
    return code({ prompt, ...options });
  }

  async embeddings(input: string): Promise<number[]> {
    const response = await this.client.embeddings({
      model: 'moonshot-v1-embedding-text-32k',
      input,
    });
    return response.data[0]?.embedding || [];
  }
}

export { kimiClient, KimiAPIClient, KIMI_CONFIG };
export type { KimiConfig, KimiMessage, KimiChatRequest, KimiChatResponse };
