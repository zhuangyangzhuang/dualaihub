export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';

export type AIModelType = 'chat' | 'completion' | 'embedding';

export type ModelCapability = 'text' | 'vision' | 'function_calling' | 'streaming';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  type: AIModelType;
  capabilities: ModelCapability[];
  maxTokens: number;
  description?: string;
}

export interface AICompletionRequest {
  model: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  functions?: AIFunction[];
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: AIFunctionCall;
}

export interface AICompletionResponse {
  id: string;
  model: string;
  choices: AIChoice[];
  usage?: AIUsage;
  created: number;
}

export interface AIChatResponse {
  id: string;
  model: string;
  choices: AIChatChoice[];
  usage?: AIUsage;
  created: number;
}

export interface AIChoice {
  index: number;
  text: string;
  finishReason: string;
}

export interface AIChatChoice {
  index: number;
  message: AIChatMessage;
  finishReason: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: AIFunctionParameters;
}

export interface AIFunctionParameters {
  type: 'object';
  properties: Record<string, AIFunctionProperty>;
  required?: string[];
}

export interface AIFunctionProperty {
  type: string;
  description?: string;
  enum?: string[];
}

export interface AIFunctionCall {
  name: string;
  arguments: string;
}

export interface AIStreamChunk {
  id: string;
  model: string;
  choices: AIStreamChoice[];
}

export interface AIStreamChoice {
  index: number;
  delta: Partial<AIChatMessage>;
  finishReason?: string;
}

export interface AIError {
  code: string;
  message: string;
  status?: number;
  provider?: AIProvider;
}

export interface AIHistoryEntry {
  id: string;
  userId: string;
  serviceType: string;
  model: string;
  prompt: string;
  result?: string;
  creditsUsed: number;
  status: 'completed' | 'failed' | 'pending';
  createdAt: Date;
}

export interface AIQuotaInfo {
  dailyLimit: number;
  dailyUsed: number;
  totalCredits: number;
  remainingCredits: number;
  resetAt?: Date;
}

export interface AIGenerateImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  responseFormat?: 'url' | 'b64_json';
}

export interface AIImageResponse {
  created: number;
  data: AIImageData[];
}

export interface AIImageData {
  url?: string;
  b64Json?: string;
}

export const SUPPORTED_AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    type: 'chat',
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    maxTokens: 128000,
    description: 'Most capable GPT-4 model with vision and function calling',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    type: 'chat',
    capabilities: ['text', 'function_calling', 'streaming'],
    maxTokens: 16385,
    description: 'Fast and efficient GPT-3.5 model',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    type: 'chat',
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    maxTokens: 200000,
    description: 'Most capable Claude model for complex tasks',
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    type: 'chat',
    capabilities: ['text', 'vision', 'function_calling', 'streaming'],
    maxTokens: 200000,
    description: 'Balanced Claude model for everyday tasks',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    type: 'chat',
    capabilities: ['text', 'vision', 'streaming'],
    maxTokens: 32768,
    description: 'Google\'s capable Gemini model',
  },
];

export const DEFAULT_AI_MODEL = 'gpt-3.5-turbo';

export const CREDITS_PER_TOKEN = 1;
export const CREDITS_PER_IMAGE = 10;
export const CREDITS_PER_TEXT_TO_SPEECH = 5;
