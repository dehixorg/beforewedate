import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SupabaseService } from '../supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const embeddingsService = app.get(EmbeddingsService);
  const supabaseService = app.get(SupabaseService);
  const supabase = supabaseService.getClient();

  console.log('Starting embedding backfill...');

  // Fetch all profiles where embedding is null
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id')
    .is('embedding', null);

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles need backfilling. Exiting.');
    process.exit(0);
  }

  console.log(`Found ${profiles.length} profiles to backfill.`);

  let successCount = 0;
  let failCount = 0;

  for (const profile of profiles) {
    console.log(`Processing user ${profile.user_id}...`);
    try {
      const success = await embeddingsService.generateAndSaveProfileEmbedding(profile.user_id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (e: any) {
      console.error(`Failed to process ${profile.user_id}: ${e.message}`);
      failCount++;
    }
    
    // Slight delay to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nBackfill complete!`);
  console.log(`Successfully generated: ${successCount}`);
  console.log(`Failed/Skipped: ${failCount}`);

  await app.close();
  process.exit(0);
}

bootstrap();
