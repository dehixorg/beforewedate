import { Controller, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  /**
   * Called asynchronously by the frontend (or a webhook) when a profile is saved.
   */
  @Post('profile/:id/sync')
  async syncProfileEmbedding(@Param('id') userId: string) {
    try {
      const success = await this.embeddingsService.generateAndSaveProfileEmbedding(userId);
      return { success };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
