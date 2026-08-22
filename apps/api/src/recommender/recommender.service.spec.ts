import { Test, TestingModule } from '@nestjs/testing';
import { RecommenderService } from './recommender.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('RecommenderService', () => {
  let service: RecommenderService;
  let supabaseClientMock: any;

  beforeEach(async () => {
    supabaseClientMock = {
      rpc: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommenderService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => supabaseClientMock,
          },
        },
      ],
    }).compile();

    service = module.get<RecommenderService>(RecommenderService);
  });

  it('should return empty array if no candidates', async () => {
    supabaseClientMock.rpc.mockResolvedValue({ data: [], error: null });
    const deck = await service.getDeck('user1');
    expect(deck).toEqual([]);
  });

  it('should properly rank candidates based on similarity, trust score, and incoming likes', async () => {
    const mockCandidates = [
      { user_id: 'c1', similarity: 0.8, trust_score: 50, incoming_likes: 0 },
      { user_id: 'c2', similarity: 0.8, trust_score: 100, incoming_likes: 0 },
      { user_id: 'c3', similarity: 0.8, trust_score: 50, incoming_likes: 10 },
    ];

    supabaseClientMock.rpc.mockResolvedValue({ data: mockCandidates, error: null });

    const deck = await service.getDeck('user1');

    // Expected Scores:
    // c1: 80 (sim) + 0 (trust) + 0 (likes) = 80
    // c2: 80 (sim) + 10 (trust) + 0 (likes) = 90
    // c3: 80 (sim) + 0 (trust) + 10 (likes) = 90

    // Since c2 and c3 have 90, c1 has 80.
    // Ranked array should have c2/c3 first, c1 last.
    expect(deck.length).toBe(3);
    expect(deck[0].final_rank_score).toBe(90);
    expect(deck[1].final_rank_score).toBe(90);
    expect(deck[2].final_rank_score).toBe(80);
    expect(deck[2].user_id).toBe('c1');
  });

  it('should throw an error if rpc fails', async () => {
    supabaseClientMock.rpc.mockResolvedValue({ data: null, error: { message: 'Database error' } });
    await expect(service.getDeck('user1')).rejects.toThrow('Database error');
  });
});
