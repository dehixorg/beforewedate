import { Controller, Get, Delete, Param, Headers, HttpException, HttpStatus, Post, Body } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Controller('coach/memory')
export class MemoryController {
  private supabaseAdmin;

  constructor(
    private readonly memoryService: MemoryService,
    private readonly configService: ConfigService
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  // Debug/Extraction endpoint
  @Post('extract')
  async extractMemory(
    @Headers('x-user-id') userId: string,
    @Body('transcript') transcript: string,
    @Body('scope') scope: 'user' | 'couple',
    @Body('ref_id') refId: string,
    @Body('kind') kind: 'profile' | 'resolution' | 'session'
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const insight = await this.memoryService.extractAndStoreMemory(transcript, scope, refId, kind);
    return { extracted: insight };
  }

  @Get(':scope/:refId')
  async getMemories(
    @Param('scope') scope: string,
    @Param('refId') refId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    
    // Security check: if couple scope, verify user belongs to relationship
    if (scope === 'couple') {
      const { data: rel } = await this.supabaseAdmin
        .from('relationships')
        .select('id')
        .eq('id', refId)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .single();
      if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } else if (scope === 'user' && refId !== userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { data } = await this.supabaseAdmin
      .from('coach_memory')
      .select('id, kind, summary, created_at')
      .eq('scope', scope)
      .eq('ref_id', refId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  @Delete(':id')
  async deleteMemory(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    
    // Delete requires satisfying RLS, but since we use service_role here, we must manually check
    const { data: mem } = await this.supabaseAdmin
      .from('coach_memory')
      .select('*')
      .eq('id', id)
      .single();

    if (!mem) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    if (mem.scope === 'user' && mem.ref_id !== userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (mem.scope === 'couple') {
      const { data: rel } = await this.supabaseAdmin
        .from('relationships')
        .select('id')
        .eq('id', mem.ref_id)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .single();
      if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    await this.supabaseAdmin.from('coach_memory').delete().eq('id', id);
    return { success: true };
  }
}
