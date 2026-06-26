/**
 * Sora AI Integration - OpenAI's advanced video generation model
 * Creates realistic and imaginative videos from text prompts
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface SoraConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface SoraVideoRequest {
  model?: string;
  prompt: string;
  duration?: number;
  aspect_ratio?: '1920x1080' | '1080x1920' | '1024x1024';
  resolution?: '720p' | '1080p';
  seed?: number;
  num_videos?: number;
  callback_url?: string;
}

interface SoraVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: { message: string; code: string };
}

interface SoraGenerationResponse {
  data: Array<{
    id: string;
    status: string;
    video?: { url: string };
  }>;
  error?: { message: string };
}

// ============================================================================
// Configuration
// ============================================================================

const SORA_CONFIG: SoraConfig = {
  apiKey: process.env.SORA_API_KEY || '',
  baseUrl: process.env.SORA_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.SORA_MODEL || 'sora-2',
};

class SoraAPIClient {
  private config: SoraConfig;
  constructor(config: Partial<SoraConfig> = {}) {
    this.config = { ...SORA_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('SORA_API_KEY is not configured');
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Sora API error: ${response.status} - ${error.message || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async generateVideo(request: SoraVideoRequest): Promise<SoraGenerationResponse> {
    return this.request<SoraGenerationResponse>('/videos/generations', request);
  }

  async getVideoStatus(id: string): Promise<{ id: string; status: string; video?: { url: string }; error?: { message: string } }> {
    return this.request<{ id: string; status: string; video?: { url: string }; error?: { message: string } }>(`/videos/generations/${id}`, {});
  }
}

const soraClient = new SoraAPIClient();

// ============================================================================
// Provider Implementation
// ============================================================================

async function text(request: AIRequest): Promise<AIResponse> {
  // Sora is a video-focused AI
  return video(request);
}

async function code(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Sora does not support code generation. Use Kimi, Qwen, or GPT-4o.', provider: 'sora', latencyMs: 0, timestamp: Date.now() };
}

async function image(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Sora does not support standalone image generation. Use DALL-E or other image providers.', provider: 'sora', latencyMs: 0, timestamp: Date.now() };
}

async function video(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await soraClient.generateVideo({
      model: request.model || SORA_CONFIG.model,
      prompt: request.prompt,
      duration: request.options?.duration as number || 10,
      aspect_ratio: (request.options?.aspectRatio as '1920x1080' | '1080x1920' | '1024x1024') || '1920x1080',
      resolution: (request.options?.resolution as '720p' | '1080p') || '1080p',
      seed: request.options?.seed as number,
      num_videos: 1,
    });

    if (response.error) {
      return { success: false, error: response.error.message, provider: 'sora', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    }

    const generation = response.data[0];
    if (!generation) {
      return { success: false, error: 'No video generation returned', provider: 'sora', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    }

    // Poll for video completion
    const videoUrl = await pollForVideoCompletion(generation.id);

    return {
      success: true,
      data: { videoUrl, generationId: generation.id },
      provider: 'sora',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'sora', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function pollForVideoCompletion(id: string, maxAttempts: number = 60, intervalMs: number = 10000): Promise<string | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await soraClient.getVideoStatus(id);
    if (status.status === 'completed' && status.video?.url) {
      return status.video.url;
    }
    if (status.status === 'failed') {
      throw new Error(status.error?.message || 'Video generation failed');
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Video generation timed out');
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Sora does not support music generation.', provider: 'sora', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    // Sora doesn't have a dedicated health endpoint, so we try a minimal generation
    await soraClient.generateVideo({ prompt: 'test', duration: 1 });
    return { provider: 'sora', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'sora', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const soraAI: AIProvider = { text, code, image, video, music, healthCheck };

export class SoraProvider {
  private client: SoraAPIClient;
  constructor(config?: Partial<SoraConfig>) { this.client = new SoraAPIClient(config); }
  async video(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return video({ prompt, ...options }); }
  async getVideoStatus(id: string) { return this.client.getVideoStatus(id); }
}

export { soraClient, SORA_CONFIG };
export type { SoraConfig, SoraVideoRequest, SoraVideoResponse };
