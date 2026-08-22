import { Test, TestingModule } from '@nestjs/testing';
import { TrustScoreService } from './trust-score.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('TrustScoreService', () => {
  let service: TrustScoreService;
  let supabaseClientMock: any;

  beforeEach(async () => {
    supabaseClientMock = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustScoreService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => supabaseClientMock,
          },
        },
      ],
    }).compile();

    service = module.get<TrustScoreService>(TrustScoreService);
  });

  it('should calculate base score (50) for a brand new unverified user with no profile', async () => {
    supabaseClientMock.single
      .mockResolvedValueOnce({ data: { verified: false, face_verified: false }, error: null }) // users
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }); // profiles
      
    supabaseClientMock.eq.mockResolvedValueOnce({ error: null }); // update

    const result = await service.recalculateUserScore('u1');
    expect(result.new_score).toBe(50);
  });

  it('should calculate max score for a fully verified user with 6 photos and bio', async () => {
    supabaseClientMock.single
      .mockResolvedValueOnce({ data: { verified: true, face_verified: true }, error: null }) // users
      .mockResolvedValueOnce({ 
        data: { 
          photos: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], 
          prompts: [{}, {}, {}], 
          bio: 'This is a sufficiently long bio string to get the points' 
        }, 
        error: null 
      }); // profiles

    supabaseClientMock.eq.mockResolvedValueOnce({ error: null }); // update

    const result = await service.recalculateUserScore('u1');
    // base (50) + verified (20) + photos (30) + prompts (9) + bio (5) = 114
    expect(result.new_score).toBe(114);
    expect(result.breakdown.verified).toBe(20);
    expect(result.breakdown.photos).toBe(30);
    expect(result.breakdown.prompts).toBe(9);
    expect(result.breakdown.bio).toBe(5);
  });
});
