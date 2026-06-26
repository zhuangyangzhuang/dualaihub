/**
 * Pika AI Integration - Creative video generation
 * Specializes in AI-powered video creation from text and images
 */

import type { AIRequest, AIResponse, AIProvider, HealthStatus } from './scheduler';

// ============================================================================
// Types
// ============================================================================

interface PikaConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface PikaVideoRequest {
  model?: string;
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  seed?: number;
  num_frames?: number;
  guidance_scale?: number;
}

interface PikaVideoResponse {
  id: string;
  status: string;
  video_url?: string;
  error?: { message: string };
}

interface PikaGenerationResponse {
  ids: string[];
}

interface PikaStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: { message: string };
}

// ============================================================================
// Configuration
// ============================================================================

const PIKA_CONFIG: PikaConfig = {
  apiKey: process.env.PIKA_API_KEY || '',
  baseUrl: process.env.PIKA_BASE_URL || 'https://api.pika.art/v1',
  model: process.env.PIKA_MODEL || 'pika-2',
};

class PikaAPIClient {
  private config: PikaConfig;
  constructor(config: Partial<PikaConfig> = {}) {
    this.config = { ...PIKA_CONFIG, ...config };
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiKey) throw new Error('PIKA_API_KEY is not configured');
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
      throw new Error(`Pika API error: ${response.status} - ${error.message || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async generateVideo(request: PikaVideoRequest): Promise<PikaVideoResponse> {
    return this.request<PikaVideoResponse>('/generations', request);
  }

  async getGenerationStatus(id: string): Promise<PikaStatusResponse> {
    return this.request<PikaStatusResponse>(`/generations/${id}`, {});
  }
}

const pikaClient = new PikaAPIClient();

// ============================================================================
// Provider Implementation
// ============================================================================

async function text(request: AIRequest): Promise<AIResponse> {
  // Pika is a video-focused AI, but can be used for creative text tasks
  return video(request);
}

async function code(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Pika does not support code generation. Use Kimi, Qwen, or GPT-4o.', provider: 'pika', latencyMs: 0, timestamp: Date.now() };
}

async function image(request: AIRequest): Promise<AIResponse> {
  // Pika can generate frames/images as part of video generation
  // For standalone image generation, route to other providers
  return { success: false, error: 'Pika does not support standalone image generation. Use Doubao, Qwen, or DALL-E.', provider: 'pika', latencyMs: 0, timestamp: Date.now() };
}

async function video(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const response = await pikaClient.generateVideo({
      model: request.model || PIKA_CONFIG.model,
      prompt: request.prompt,
      negative_prompt: request.options?.negativePrompt as string,
      duration: request.options?.duration as number || 5,
      aspect_ratio: (request.options?.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
      resolution: (request.options?.resolution as '720p' | '1080p') || '1080p',
      seed: request.options?.seed as number,
      guidance_scale: request.options?.guidanceScale as number || 7.5,
    });

    if (response.error) {
      return { success: false, error: response.error.message, provider: 'pika', latencyMs: Date.now() - startTime, timestamp: Date.now() };
    }

    // Poll for video completion
    const videoUrl = await pollForVideoCompletion(response.id);

    return {
      success: true,
      data: { videoUrl, generationId: response.id },
      provider: 'pika',
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), provider: 'pika', latencyMs: Date.now() - startTime, timestamp: Date.now() };
  }
}

async function pollForVideoCompletion(id: string, maxAttempts: number = 60, intervalMs: number = 5000): Promise<string | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await pikaClient.getGenerationStatus(id);
    if (status.status === 'completed' && status.video_url) {
      return status.video_url;
    }
    if (status.status === 'failed') {
      throw new Error(status.error?.message || 'Video generation failed');
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Video generation timed out');
}

async function music(_request: AIRequest): Promise<AIResponse> {
  return { success: false, error: 'Pika does not support music generation.', provider: 'pika', latencyMs: 0, timestamp: Date.now() };
}

async function healthCheck(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    // Pika doesn't have a dedicated health endpoint, so we try a minimal generation
    await pikaClient.generateVideo({ prompt: 'test', duration: 1, resolution: '720p' });
    return { provider: 'pika', healthy: true, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 0 };
  } catch {
    return { provider: 'pika', healthy: false, latencyMs: Date.now() - start, lastCheck: Date.now(), consecutiveFailures: 1 };
  }
}

export const pikaAI: AIProvider = { text, code, image, video, music, healthCheck };

export class PikaProvider {
  private client: PikaAPIClient;
  constructor(config?: Partial<PikaConfig>) { this.client = new PikaAPIClient(config); }
  async video(prompt: string, options?: Partial<AIRequest>): Promise<AIResponse> { return video({ prompt, ...options }); }
  async getVideoStatus(id: string): Promise<PikaStatusResponse> { return this.client.getGenerationStatus(id); }
}

export { pikaClient, PIKA_CONFIG };
export type { PikaConfig, PikaVideoRequest, PikaVideoResponse, PikaStatusResponse };
