import { getApiClient } from './aws-api';

export type AIRole = 'user' | 'assistant' | 'system';
export interface AITextMessage { role: AIRole; content: string }

export interface AIGenerateOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AIService: Thin wrapper around AWS API client for Bedrock chat
 */
export class AIService {
  private defaultModelId: string;

  constructor(defaultModelId: string = 'anthropic.claude-3-5-sonnet-20241022-v2:0') {
    this.defaultModelId = defaultModelId;
  }

  async generateReply(history: AITextMessage[], options?: AIGenerateOptions): Promise<string> {
    const api = getApiClient();
    const response = await api.aiChat(history, {
      modelId: options?.modelId || this.defaultModelId,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens ?? 800
    });

    if (!response.success || !response.data?.reply) {
      throw new Error(response.error || 'AI generation failed');
    }
    return response.data.reply;
  }

  getModelId(): string {
    return this.defaultModelId;
  }

  setModelId(modelId: string) {
    this.defaultModelId = modelId;
  }
}

export default AIService;
