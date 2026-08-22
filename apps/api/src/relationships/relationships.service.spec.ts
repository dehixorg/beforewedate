import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipsService } from './relationships.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

// Mock Supabase
const mockUpdate = jest.fn();
const mockEq3 = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'test-id' } }) }) });
const mockEq2 = jest.fn().mockReturnValue({ eq: mockEq3 });
const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
const mockIn = jest.fn().mockResolvedValue({ data: {} });

const mockSupabase = {
  from: jest.fn().mockImplementation((table) => {
    if (table === 'users') {
      return { update: jest.fn().mockReturnValue({ in: mockIn }) };
    }
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'rel-1', user_a: 'user-a', user_b: 'user-b', state: 'official', paused_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString() }
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
          })
        })
      })
    };
  }),
  rpc: jest.fn()
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

describe('RelationshipsService Safety Rules', () => {
  let service: RelationshipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('dummy') }
        }
      ],
    }).compile();

    service = module.get<RelationshipsService>(RelationshipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows a user to accept goOfficial', async () => {
    mockSupabase.from.mockImplementationOnce((table) => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'match-1', user_a: 'user-a', user_b: 'user-b' }
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
          })
        })
      })
    }));

    const res = await service.goOfficial('match-1', 'user-a');
    expect(res).toBeDefined();
  });

  it('allows unilateral pause by either user', async () => {
    const res = await service.pause('rel-1', 'user-a');
    expect(res).toBeDefined();
    expect(mockSupabase.from).toHaveBeenCalledWith('relationships');
  });

  it('allows instant unilateral End Now (safety exit) by either user', async () => {
    const res = await service.end('rel-1', 'user-b');
    expect(res).toBeDefined();
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockIn).toHaveBeenCalledWith('id', ['user-a', 'user-b']); // Proves both are put back on market
  });

  it('rejects unpause if under 48 hours', async () => {
    // Mock relation with pause only 1 hour ago
    mockSupabase.from.mockImplementationOnce((table) => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'rel-1', user_a: 'user-a', user_b: 'user-b', state: 'paused', paused_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
          })
        })
      })
    }));

    await expect(service.unpause('rel-1', 'user-a')).rejects.toThrow(HttpException);
  });

  it('allows unpause if over 48 hours', async () => {
    // Mock relation with pause 50 hours ago
    mockSupabase.from.mockImplementationOnce((table) => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'rel-1', user_a: 'user-a', user_b: 'user-b', state: 'paused', paused_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString() }
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
          })
        })
      })
    }));

    const res = await service.unpause('rel-1', 'user-a');
    expect(res).toBeDefined();
  });
});
