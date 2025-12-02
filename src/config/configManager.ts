import * as vscode from 'vscode';
import { LLMProvider, LLMConfig, ValidationResult, DEFAULT_CONFIG, PROVIDER_MODELS } from '../models/config.model';
import { Logger } from '../utils/logger';

export class ConfigManager {
  private static readonly CONFIG_SECTION = 'errorExplainer';
  private static readonly SECRET_KEY_PREFIX = 'errorExplainer.apiKey';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: Logger
  ) {}

  async getProvider(): Promise<LLMProvider> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const provider = config.get<string>('provider', DEFAULT_CONFIG.provider);
    return provider as LLMProvider;
  }

  async getModel(): Promise<string> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const provider = await this.getProvider();
    const model = config.get<string>('model');
    
    if (model) {
      return model;
    }

    const defaultModels: Record<LLMProvider, string> = {
      [LLMProvider.OpenAI]: 'gpt-4',
      [LLMProvider.Anthropic]: 'claude-3-sonnet-20240229',
      [LLMProvider.Ollama]: 'llama2',
      [LLMProvider.Custom]: ''
    };

    return defaultModels[provider];
  }

  async getApiKey(provider?: LLMProvider): Promise<string | undefined> {
    const targetProvider = provider || await this.getProvider();
    const secretKey = `${ConfigManager.SECRET_KEY_PREFIX}.${targetProvider}`;
    
    try {
      const apiKey = await this.context.secrets.get(secretKey);
      return apiKey;
    } catch (error) {
      this.logger.error(`Failed to retrieve API key for ${targetProvider}`, error);
      return undefined;
    }
  }

  async setApiKey(apiKey: string, provider?: LLMProvider): Promise<void> {
    const targetProvider = provider || await this.getProvider();
    const secretKey = `${ConfigManager.SECRET_KEY_PREFIX}.${targetProvider}`;
    
    try {
      await this.context.secrets.store(secretKey, apiKey);
      this.logger.info(`API key stored successfully for ${targetProvider}`);
    } catch (error) {
      this.logger.error(`Failed to store API key for ${targetProvider}`, error);
      throw new Error(`Failed to store API key: ${error}`);
    }
  }

  async deleteApiKey(provider?: LLMProvider): Promise<void> {
    const targetProvider = provider || await this.getProvider();
    const secretKey = `${ConfigManager.SECRET_KEY_PREFIX}.${targetProvider}`;
    
    try {
      await this.context.secrets.delete(secretKey);
      this.logger.info(`API key deleted for ${targetProvider}`);
    } catch (error) {
      this.logger.error(`Failed to delete API key for ${targetProvider}`, error);
      throw new Error(`Failed to delete API key: ${error}`);
    }
  }

  async getCustomEndpoint(): Promise<string | undefined> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    return config.get<string>('customEndpoint');
  }

  async getMaxTokens(): Promise<number> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    return config.get<number>('maxTokens', DEFAULT_CONFIG.maxTokens);
  }

  async getTemperature(): Promise<number> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    return config.get<number>('temperature', DEFAULT_CONFIG.temperature);
  }

  async getConfig(): Promise<LLMConfig> {
    const provider = await this.getProvider();
    const model = await this.getModel();
    const apiKey = await this.getApiKey(provider);
    const customEndpoint = await this.getCustomEndpoint();
    const maxTokens = await this.getMaxTokens();
    const temperature = await this.getTemperature();

    return {
      provider,
      model,
      apiKey,
      customEndpoint,
      maxTokens,
      temperature
    };
  }

  async validateConfig(): Promise<ValidationResult> {
    const errors: string[] = [];
    const config = await this.getConfig();

    if (!Object.values(LLMProvider).includes(config.provider)) {
      errors.push(`Invalid provider: ${config.provider}`);
    }

    if (!config.model || config.model.trim().length === 0) {
      errors.push('Model name is required');
    }

    if (config.provider !== LLMProvider.Ollama) {
      if (!config.apiKey || config.apiKey.trim().length === 0) {
        errors.push(`API key is required for ${config.provider}`);
      }
    }

    if (config.provider === LLMProvider.Custom) {
      if (!config.customEndpoint || config.customEndpoint.trim().length === 0) {
        errors.push('Custom endpoint URL is required for custom provider');
      } else {
        try {
          new URL(config.customEndpoint);
        } catch {
          errors.push('Custom endpoint must be a valid URL');
        }
      }
    }

    if (config.maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    const supportedModels = PROVIDER_MODELS[config.provider];
    if (supportedModels.length > 0 && !supportedModels.includes(config.model)) {
      errors.push(`Model ${config.model} is not supported by ${config.provider}. Supported models: ${supportedModels.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
