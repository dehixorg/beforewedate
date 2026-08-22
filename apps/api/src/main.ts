import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { PostHog } from 'posthog-node';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://dummy@o0.ingest.sentry.io/0',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  const posthog = new PostHog(
    process.env.POSTHOG_API_KEY || 'phc_dummy',
    { host: 'https://app.posthog.com' }
  );

  const app = await NestFactory.create(AppModule);
  // Optional: Global error handler or Sentry interceptor could be added here
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
