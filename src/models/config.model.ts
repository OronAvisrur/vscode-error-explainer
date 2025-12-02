export enum LLMProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Ollama = 'ollama',
  Custom = 'custom'
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  customEndpoint?: string;
  maxTokens: number;
  temperature: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const DEFAULT_CONFIG: Omit<LLMConfig, 'apiKey'> = {
  provider: LLMProvider.OpenAI,
  model: 'gpt-4',
  maxTokens: 1000,
  temperature: 0.7,
  customEndpoint: undefined
};

export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  [LLMProvider.OpenAI]: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  [LLMProvider.Anthropic]: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  [LLMProvider.Ollama]: ['llama2', 'codellama', 'mistral', 'mixtral'],
  [LLMProvider.Custom]: []
};
