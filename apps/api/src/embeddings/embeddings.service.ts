import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AzureService } from '../azure/azure.service';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly azureService: AzureService,
  ) {}

  /**
   * Concatenates the relevant profile fields into a single dense string
   * for the embedding model to process.
   */
  formatProfileContent(profile: any): string {
    const parts: string[] = [];

    if (profile.mode) {
      parts.push(`Looking for: ${profile.mode}`);
    }
    if (profile.bio) {
      parts.push(`Bio: ${profile.bio}`);
    }
    
    if (Array.isArray(profile.prompts) && profile.prompts.length > 0) {
      parts.push('Prompts:');
      profile.prompts.forEach((p: any) => {
        parts.push(`Q: ${p.q}\nA: ${p.a}`);
      });
    }

    if (Array.isArray(profile.interests) && profile.interests.length > 0) {
      parts.push(`Interests: ${profile.interests.join(', ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Generates an embedding for a specific user's profile and saves it
   * into the profiles.embedding vector column.
   */
  async generateAndSaveProfileEmbedding(userId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      this.logger.error(`Could not fetch profile for embedding: ${profileError?.message}`);
      return false;
    }

    // 2. Format Context
    const textContent = this.formatProfileContent(profile);
    
    // If there is barely any content, skip embedding (avoids empty vectors)
    if (textContent.trim().length < 10) {
      return false;
    }

    try {
      // 3. Call Azure OpenAI Embeddings
      const vector = await this.azureService.embeddingClient.generateEmbedding(textContent);

      // 4. Save to pgvector column
      // We must format the array as a string for Postgres vector casting: '[0.1, 0.2, ...]'
      const vectorString = `[${vector.join(',')}]`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ embedding: vectorString as any }) // Cast as any because the JS client might not know the exact pgvector type string
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      this.logger.log(`Successfully generated and saved embedding for user ${userId}`);
      return true;

    } catch (e: any) {
      this.logger.error(`Failed to generate/save embedding for ${userId}: ${e.message}`);
      return false;
    }
  }
}
