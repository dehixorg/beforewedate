# BeforeWeDate — Monorepo

## Architecture Overview
This is a `pnpm` + Turborepo monorepo consisting of:
- **`apps/mobile`**: Expo (React Native) consumer mobile app.
- **`apps/admin`**: Next.js App Router admin dashboard.
- **`apps/api`**: NestJS backend for secure Azure AI processing.
- **`packages/shared`**: Shared TypeScript definitions and Zod schemas.
- **`supabase/migrations`**: PostgreSQL database schemas with RLS and PostGIS/vector support.

## Prerequisites
- Node.js 20+
- pnpm 9+
- Supabase CLI
- Docker (for local Supabase)

## Installation
1. Install dependencies across the entire monorepo:
   ```bash
   pnpm install
   ```
2. Copy the `.env.example` file in each app to `.env` and fill in your keys (e.g., Azure keys in `apps/api/.env`).

## Running the Apps

You can run individual apps from the root directory using Turborepo.

**Run the NestJS Backend API:**
```bash
pnpm --filter api run start:dev
```

**Run the Next.js Admin Dashboard:**
```bash
pnpm --filter admin run dev
```

**Run the Expo Mobile App:**
```bash
pnpm --filter mobile run start
```

**Run everything concurrently (not recommended unless your machine has high resources):**
```bash
pnpm run dev
```

## Running the CI Checks
To verify type safety and linting across the entire monorepo:
```bash
pnpm run lint
pnpm run typecheck
```
