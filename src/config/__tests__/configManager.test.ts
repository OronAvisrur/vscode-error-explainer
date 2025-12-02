import { ConfigManager } from '../configManager';
import { LLMProvider } from '../../models/config.model';
import { Logger } from '../../utils/logger';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockContext: vscode.ExtensionContext;
  let mockLogger: Logger;
  let mockSecrets: any;
  let mockConfig: any;

  beforeEach(() => {
    mockSecrets = {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn()
    };

    mockConfig = {
      get: jest.fn()
    };

    mockContext = {
      secrets: mockSecrets
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    (vscode.workspace.getConfiguration as jest.Mock) = jest.fn().mockReturnValue(mockConfig);

    configManager = new ConfigManager(mockContext, mockLogger);
  });

  describe('getProvider', () => {
    it('should return configured provider', async () => {
      mockConfig.get.mockReturnValue('anthropic');

      const result = await configManager.getProvider();

      expect(result).toBe(LLMProvider.Anthropic);
      expect(mockConfig.get).toHaveBeenCalledWith('provider', 'openai');
    });

    it('should return default provider when not configured', async () => {
      mockConfig.get.mockReturnValue('openai');

      const result = await configManager.getProvider();

      expect(result).toBe(LLMProvider.OpenAI);
    });
  });

  describe('getModel', () => {
    it('should return configured model', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'model') return 'gpt-4-turbo';
        if (key === 'provider') return 'openai';
        return undefined;
      });

      const result = await configManager.getModel();

      expect(result).toBe('gpt-4-turbo');
    });

    it('should return default model for OpenAI when not configured', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'model') return undefined;
        if (key === 'provider') return 'openai';
        return undefined;
      });

      const result = await configManager.getModel();

      expect(result).toBe('gpt-4');
    });

    it('should return default model for Anthropic when not configured', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'model') return undefined;
        if (key === 'provider') return 'anthropic';
        return undefined;
      });

      const result = await configManager.getModel();

      expect(result).toBe('claude-3-sonnet-20240229');
    });

    it('should return default model for Ollama when not configured', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'model') return undefined;
        if (key === 'provider') return 'ollama';
        return undefined;
      });

      const result = await configManager.getModel();

      expect(result).toBe('llama2');
    });
  });

  describe('getApiKey', () => {
    it('should retrieve API key for current provider', async () => {
      mockConfig.get.mockReturnValue('openai');
      mockSecrets.get.mockResolvedValue('sk-test-key-123');

      const result = await configManager.getApiKey();

      expect(result).toBe('sk-test-key-123');
      expect(mockSecrets.get).toHaveBeenCalledWith('errorExplainer.apiKey.openai');
    });

    it('should retrieve API key for specific provider', async () => {
      mockSecrets.get.mockResolvedValue('sk-anthropic-key-456');

      const result = await configManager.getApiKey(LLMProvider.Anthropic);

      expect(result).toBe('sk-anthropic-key-456');
      expect(mockSecrets.get).toHaveBeenCalledWith('errorExplainer.apiKey.anthropic');
    });

    it('should return undefined when API key not found', async () => {
      mockConfig.get.mockReturnValue('openai');
      mockSecrets.get.mockResolvedValue(undefined);

      const result = await configManager.getApiKey();

      expect(result).toBeUndefined();
    });

    it('should handle errors when retrieving API key', async () => {
      mockConfig.get.mockReturnValue('openai');
      mockSecrets.get.mockRejectedValue(new Error('Secret storage error'));

      const result = await configManager.getApiKey();

      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('setApiKey', () => {
    it('should store API key for current provider', async () => {
      mockConfig.get.mockReturnValue('openai');

      await configManager.setApiKey('sk-new-key-789');

      expect(mockSecrets.store).toHaveBeenCalledWith('errorExplainer.apiKey.openai', 'sk-new-key-789');
      expect(mockLogger.info).toHaveBeenCalledWith('API key stored successfully for openai');
    });

    it('should store API key for specific provider', async () => {
      await configManager.setApiKey('sk-anthropic-new', LLMProvider.Anthropic);

      expect(mockSecrets.store).toHaveBeenCalledWith('errorExplainer.apiKey.anthropic', 'sk-anthropic-new');
      expect(mockLogger.info).toHaveBeenCalledWith('API key stored successfully for anthropic');
    });

    it('should throw error when storage fails', async () => {
      mockConfig.get.mockReturnValue('openai');
      mockSecrets.store.mockRejectedValue(new Error('Storage failed'));

      await expect(configManager.setApiKey('sk-key')).rejects.toThrow('Failed to store API key');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key for current provider', async () => {
      mockConfig.get.mockReturnValue('openai');

      await configManager.deleteApiKey();

      expect(mockSecrets.delete).toHaveBeenCalledWith('errorExplainer.apiKey.openai');
      expect(mockLogger.info).toHaveBeenCalledWith('API key deleted for openai');
    });

    it('should delete API key for specific provider', async () => {
      await configManager.deleteApiKey(LLMProvider.Ollama);

      expect(mockSecrets.delete).toHaveBeenCalledWith('errorExplainer.apiKey.ollama');
      expect(mockLogger.info).toHaveBeenCalledWith('API key deleted for ollama');
    });

    it('should throw error when deletion fails', async () => {
      mockConfig.get.mockReturnValue('openai');
      mockSecrets.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(configManager.deleteApiKey()).rejects.toThrow('Failed to delete API key');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getCustomEndpoint', () => {
    it('should return custom endpoint when configured', async () => {
      mockConfig.get.mockReturnValue('https://custom.api.com/v1');

      const result = await configManager.getCustomEndpoint();

      expect(result).toBe('https://custom.api.com/v1');
      expect(mockConfig.get).toHaveBeenCalledWith('customEndpoint');
    });

    it('should return undefined when not configured', async () => {
      mockConfig.get.mockReturnValue(undefined);

      const result = await configManager.getCustomEndpoint();

      expect(result).toBeUndefined();
    });
  });

  describe('getMaxTokens', () => {
    it('should return configured max tokens', async () => {
      mockConfig.get.mockReturnValue(2000);

      const result = await configManager.getMaxTokens();

      expect(result).toBe(2000);
    });

    it('should return default max tokens when not configured', async () => {
      mockConfig.get.mockReturnValue(undefined);

      const result = await configManager.getMaxTokens();

      expect(result).toBe(1000);
    });
  });

  describe('getTemperature', () => {
    it('should return configured temperature', async () => {
      mockConfig.get.mockReturnValue(0.5);

      const result = await configManager.getTemperature();

      expect(result).toBe(0.5);
    });

    it('should return default temperature when not configured', async () => {
      mockConfig.get.mockReturnValue(undefined);

      const result = await configManager.getTemperature();

      expect(result).toBe(0.7);
    });
  });

  describe('getConfig', () => {
    it('should return complete configuration', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'anthropic',
          model: 'claude-3-opus-20240229',
          customEndpoint: 'https://api.custom.com',
          maxTokens: 1500,
          temperature: 0.8
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-test-api-key');

      const result = await configManager.getConfig();

      expect(result).toEqual({
        provider: LLMProvider.Anthropic,
        model: 'claude-3-opus-20240229',
        apiKey: 'sk-test-api-key',
        customEndpoint: 'https://api.custom.com',
        maxTokens: 1500,
        temperature: 0.8
      });
    });
  });

  describe('validateConfig', () => {
    it('should return valid for correct OpenAI configuration', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-valid-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid provider', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'invalid-provider',
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid provider: invalid-provider');
    });

    it('should detect missing model', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: '',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Model name is required');
    });

    it('should detect missing API key for non-Ollama providers', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue(undefined);

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is required for openai');
    });

    it('should not require API key for Ollama', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'ollama',
          model: 'llama2',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue(undefined);

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing custom endpoint for custom provider', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'custom',
          model: 'custom-model',
          customEndpoint: '',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom endpoint URL is required for custom provider');
    });

    it('should detect invalid custom endpoint URL', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'custom',
          model: 'custom-model',
          customEndpoint: 'not-a-valid-url',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom endpoint must be a valid URL');
    });

    it('should detect invalid max tokens', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: -100,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max tokens must be greater than 0');
    });

    it('should detect temperature out of range (below)', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: -0.5
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature must be between 0 and 2');
    });

    it('should detect temperature out of range (above)', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'gpt-4',
          maxTokens: 1000,
          temperature: 3.0
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature must be between 0 and 2');
    });

    it('should detect unsupported model for provider', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: 'claude-3-opus-20240229',
          maxTokens: 1000,
          temperature: 0.7
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('sk-key');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Model claude-3-opus-20240229 is not supported by openai');
    });

    it('should collect multiple validation errors', async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const values: any = {
          provider: 'openai',
          model: '',
          maxTokens: -50,
          temperature: 5.0
        };
        return values[key] ?? defaultValue;
      });
      mockSecrets.get.mockResolvedValue('');

      const result = await configManager.validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
