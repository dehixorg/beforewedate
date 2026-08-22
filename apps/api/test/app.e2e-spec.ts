import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AzureService } from './../src/azure/azure.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let azureService = {
    contentSafetyClient: {
      analyzeText: jest.fn().mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 4 }
        ]
      })
    }
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AzureService)
    .useValue(azureService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Auth + RLS Integration', () => {
    it('/recommender/deck (GET) without x-user-id should return 401 Unauthorized', () => {
      return request(app.getHttpServer())
        .get('/recommender/deck')
        .expect(401);
    });

    it('/recommender/deck (GET) with x-user-id should proceed (may return 200 or throw based on DB state, but not 401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/recommender/deck')
        .set('x-user-id', 'dummy-id');
      
      expect(res.status).not.toBe(401);
    });
  });

  describe('Moderation Integration', () => {
    it('/moderation/moderate (POST) should flag toxic content', async () => {
      azureService.contentSafetyClient.analyzeText.mockResolvedValueOnce({
        categoriesAnalysis: [
          { category: 'Hate', severity: 4 }
        ]
      });

      const res = await request(app.getHttpServer())
        .post('/moderation/moderate')
        .set('x-user-id', 'dummy-id')
        .send({ text: 'I hate you', sender_id: 'dummy-id', match_id: 'dummy-match' });

      expect(res.status).toBe(201); // Created (NestJS POST default)
      expect(res.body.flagged).toBe(true);
      expect(res.body.action).toBe('block');
    });
  });
});
