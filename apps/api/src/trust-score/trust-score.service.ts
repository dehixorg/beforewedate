import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TrustScoreService {
  private readonly logger = new Logger(TrustScoreService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async recalculateUserScore(userId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Fetch user and profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`Failed to fetch user: ${userError?.message}`);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "No rows found". It's fine if they don't have a profile yet.
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Algorithm: Base 50
    let score = 50;
    const breakdown = {
      base: 50,
      verified: 0,
      photos: 0,
      prompts: 0,
      bio: 0,
    };

    if (user.verified || user.face_verified) {
      score += 20;
      breakdown.verified = 20;
    }

    if (profile) {
      const photos = profile.photos || [];
      const photosScore = photos.length * 5;
      score += photosScore;
      breakdown.photos = photosScore;

      // Prompts is stored as JSONB. Assuming it's an array of objects.
      const prompts = Array.isArray(profile.prompts) ? profile.prompts : [];
      const promptsScore = prompts.length * 3;
      score += promptsScore;
      breakdown.prompts = promptsScore;

      const bio = profile.bio || '';
      if (bio.length >= 20) {
        score += 5;
        breakdown.bio = 5;
      }
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ trust_score: score })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update score: ${updateError.message}`);
    }

    return {
      new_score: score,
      breakdown,
    };
  }
}
