import { Controller, Get } from '@nestjs/common';
import { AzureService } from '../azure/azure.service';

@Controller('health')
export class HealthController {
  constructor(private readonly azureService: AzureService) {}

  @Get()
  async checkHealth() {
    const azureStatus = await this.azureService.verifyAllConnections();
    const isHealthy = Object.values(azureStatus).every((status) => status === 'ok');

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        azure: azureStatus,
      },
    };
  }
}
