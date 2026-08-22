import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AzureModule } from './azure/azure.module';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TrustScoreModule } from './trust-score/trust-score.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { RecommenderModule } from './recommender/recommender.module';
import { ChatModule } from './chat/chat.module';
import { CoachModule } from './coach/coach.module';
import { EventsModule } from './events/events.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { DatesModule } from './dates/dates.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AzureModule,
    HealthModule,
    SupabaseModule,
    TrustScoreModule,
    EmbeddingsModule,
    RecommenderModule,
    ChatModule,
    CoachModule,
    EventsModule,
    RelationshipsModule,
    DatesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
