import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

@Injectable()
export class MemoryService {
  private supabaseAdmin;
  private openai: OpenAIClient;
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    this.openai = new OpenAIClient(
      this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || '',
      new AzureKeyCredential(this.configService.get<string>('AZURE_OPENAI_API_KEY') || '')
    );
  }

  // Generate embedding for text
  private async getEmbedding(text: string): Promise<number[]> {
    const deploymentId = this.configService.get<string>('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') || 'text-embedding-ada-002';
    const result = await this.openai.getEmbeddings(deploymentId, [text]);
    return result.data[0].embedding;
  }

  // Extract memory from transcript
  async extractAndStoreMemory(transcript: string, scope: 'user' | 'couple', refId: string, kind: 'profile' | 'resolution' | 'session') {
    const deploymentId = this.configService.get<string>('AZURE_OPENAI_CHAT_DEPLOYMENT') || 'gpt-4';
    
    // Azure Foundry Agent Extraction
    const extractionPrompt = `
    You are an AI relationship coach. Analyze the following transcript.
    If scope is 'user', extract a 1-sentence insight about their communication style, triggers, or boundaries.
    If scope is 'couple', extract a 1-sentence insight about what conflict resolution tactics worked for them here.
    If nothing is notable, output exactly "NONE".
    
    Transcript: ${transcript}
    `;

    const response = await this.openai.getChatCompletions(deploymentId, [
      { role: 'system', content: extractionPrompt }
    ]);

    const insight = response.choices[0].message?.content?.trim();
    if (!insight || insight === 'NONE') return null;

    // Embed and Store
    const embedding = await this.getEmbedding(insight);

    const { data, error } = await this.supabaseAdmin
      .from('coach_memory')
      .insert({
        scope,
        ref_id: refId,
        kind,
        summary: insight,
        embedding: `[${embedding.join(',')}]`
      });

    if (error) {
      this.logger.error('Failed to store memory', error);
      throw new Error('Database error');
    }
    return insight;
  }

  // Retrieve contextual memory
  async searchMemory(query: string, scope: 'user' | 'couple', refId: string) {
    const embedding = await this.getEmbedding(query);
    const { data, error } = await this.supabaseAdmin.rpc('search_coach_memory', {
      p_query_embedding: `[${embedding.join(',')}]`,
      p_scope: scope,
      p_ref_id: refId,
      p_match_threshold: 0.75,
      p_match_count: 3
    });

    if (error) {
      this.logger.error('Failed to search memory', error);
      return [];
    }
    return data;
  }
}
