import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------
// Typed Wrappers for Azure Clients
// ---------------------------------------------------------

export class AzureChatClient {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly deploymentName: string,
  ) {}

  async checkHealth(): Promise<boolean> {
    if (!this.endpoint || !this.apiKey || !this.deploymentName) return false;
    try {
      // Hit the deployment endpoint to verify auth and existence
      const url = new URL(`openai/deployments/${this.deploymentName}?api-version=2024-02-15-preview`, this.endpoint);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'api-key': this.apiKey },
      });
      // 200 OK means deployment exists and key is valid.
      // We also accept 405 Method Not Allowed as it proves network + DNS is valid.
      return response.status === 200 || response.status === 405 || response.status === 400;
    } catch (e) {
      return false;
    }
  }

  async generateChatCompletion(messages: any[]): Promise<string> {
    if (!this.endpoint || !this.apiKey || !this.deploymentName) {
      throw new Error('Azure Chat Client is not fully configured.');
    }
    const url = new URL(`openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`, this.endpoint);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate chat completion: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export class AzureEmbeddingClient {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly deploymentName: string,
  ) {}

  async checkHealth(): Promise<boolean> {
    if (!this.endpoint || !this.apiKey || !this.deploymentName) return false;
    try {
      const url = new URL(`openai/deployments/${this.deploymentName}?api-version=2024-02-15-preview`, this.endpoint);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'api-key': this.apiKey },
      });
      return response.status === 200 || response.status === 405 || response.status === 400;
    } catch (e) {
      return false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.endpoint || !this.apiKey || !this.deploymentName) {
      throw new Error('Azure Embedding Client is not fully configured.');
    }
    const url = new URL(`openai/deployments/${this.deploymentName}/embeddings?api-version=2024-02-15-preview`, this.endpoint);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate embedding: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }
}

export class ContentSafetyClient {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
  ) {}

  async checkHealth(): Promise<boolean> {
    if (!this.endpoint || !this.apiKey) return false;
    try {
      // Send empty POST. If key is invalid, it returns 401. If valid, 400 Bad Request.
      const url = new URL(`contentsafety/text:analyze?api-version=2023-10-01`, this.endpoint);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      return response.status === 400 || response.status === 200;
    } catch (e) {
      return false;
    }
  }

  async analyzeText(text: string): Promise<any> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Azure Content Safety Client is not fully configured.');
    }
    const url = new URL(`contentsafety/text:analyze?api-version=2023-10-01`, this.endpoint);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
        haltOnBlocklistHit: true,
        outputType: 'FourSeverityLevels',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to analyze text: ${response.status} ${errorText}`);
    }

    return await response.json();
  }
}

export class FoundryAgentClient {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly projectConnectionString: string,
  ) {}

  async checkHealth(): Promise<boolean> {
    if (!this.endpoint || !this.apiKey || !this.projectConnectionString) return false;
    // Foundry ping (similar to OpenAI base)
    try {
      const url = new URL(`openai/models?api-version=2024-02-15-preview`, this.endpoint);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'api-key': this.apiKey },
      });
      return response.status === 200 || response.status === 400 || response.status === 405;
    } catch (e) {
      return false;
    }
  }
}

// ---------------------------------------------------------
// Azure Service
// ---------------------------------------------------------

@Injectable()
export class AzureService {
  private readonly logger = new Logger(AzureService.name);

  public readonly chatClient: AzureChatClient;
  public readonly embeddingClient: AzureEmbeddingClient;
  public readonly contentSafetyClient: ContentSafetyClient;
  public readonly foundryClient: FoundryAgentClient;

  constructor(private configService: ConfigService) {
    // Formatting endpoints to ensure they have trailing slashes
    const ensureTrailingSlash = (url: string) => (url?.endsWith('/') ? url : `${url}/`);

    // Initialize Azure OpenAI Chat
    this.chatClient = new AzureChatClient(
      ensureTrailingSlash(this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || ''),
      this.configService.get<string>('AZURE_OPENAI_API_KEY') || '',
      this.configService.get<string>('AZURE_OPENAI_CHAT_DEPLOYMENT') || '',
    );

    // Initialize Azure OpenAI Embeddings
    this.embeddingClient = new AzureEmbeddingClient(
      ensureTrailingSlash(this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || ''),
      this.configService.get<string>('AZURE_OPENAI_API_KEY') || '',
      this.configService.get<string>('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') || '',
    );

    // Initialize Content Safety
    this.contentSafetyClient = new ContentSafetyClient(
      ensureTrailingSlash(this.configService.get<string>('AZURE_CONTENT_SAFETY_ENDPOINT') || ''),
      this.configService.get<string>('AZURE_CONTENT_SAFETY_API_KEY') || '',
    );

    // Initialize Foundry Agent Service
    this.foundryClient = new FoundryAgentClient(
      ensureTrailingSlash(this.configService.get<string>('AZURE_FOUNDRY_ENDPOINT') || ''),
      this.configService.get<string>('AZURE_FOUNDRY_API_KEY') || '',
      this.configService.get<string>('AZURE_FOUNDRY_PROJECT_CONNECTION_STRING') || '',
    );
  }

  async verifyAllConnections(): Promise<Record<string, string>> {
    return {
      chat: (await this.chatClient.checkHealth()) ? 'ok' : 'unreachable_or_missing_config',
      embedding: (await this.embeddingClient.checkHealth()) ? 'ok' : 'unreachable_or_missing_config',
      contentSafety: (await this.contentSafetyClient.checkHealth()) ? 'ok' : 'unreachable_or_missing_config',
      foundry: (await this.foundryClient.checkHealth()) ? 'ok' : 'unreachable_or_missing_config',
    };
  }
}
