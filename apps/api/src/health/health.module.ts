import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AzureModule } from '../azure/azure.module';

@Module({
  imports: [AzureModule],
  controllers: [HealthController],
})
export class HealthModule {}
