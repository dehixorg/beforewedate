import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RecommenderService {
  private readonly logger = new Logger(RecommenderService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getDeck(userId: string, distanceMeters: number = 50000): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // 1. Fetch raw candidates via PostGIS/pgvector RPC
    const { data: candidates, error } = await supabase.rpc('get_candidate_deck', {
      viewer_id: userId,
      max_distance_meters: distanceMeters,
      match_limit: 100,
    });

    if (error) {
      this.logger.error(`Failed to fetch deck for ${userId}: ${error.message}`);
      throw new Error(error.message);
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // 2. Lightweight Node.js Re-Ranker
    // Incorporates Trust Score and a stubbed Swipe Signal
    const rankedCandidates = candidates.map((c: any) => {
      // Base score is the cosine similarity (0 to 1, higher is better)
      let finalScore = c.similarity * 100;

      // Boost for high trust score (max +10 points)
      // Trust score base is 50. Above 50 gets a slight boost.
      const trustBoost = Math.max(0, (c.trust_score - 50) / 5);
      finalScore += trustBoost;

      // Swipe signal weight: +1 point per incoming like (max +20)
      const swipeSignalWeight = Math.min(20, (c.incoming_likes || 0) * 1);
      finalScore += swipeSignalWeight;

      return {
        ...c,
        final_rank_score: finalScore,
      };
    });

    // 3. Sort by final score descending
    rankedCandidates.sort((a, b) => b.final_rank_score - a.final_rank_score);

    return rankedCandidates;
  }
}
