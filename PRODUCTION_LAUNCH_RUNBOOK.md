# BeforeWeDate: Production Launch Runbook

This runbook outlines the definitive checklist for launching `BeforeWeDate` to production, including infrastructure provisioning, App Store submission requirements, on-call plans, and rollback procedures.

## 1. Production Infrastructure Checklist

### Supabase (Database & Auth)
- [ ] Create a new production Supabase project.
- [ ] Apply all migrations sequentially: `supabase db push --db-url <prod-db-url>`.
- [ ] Configure Auth providers (Phone/Twilio or equivalent) in the Supabase Dashboard.
- [ ] Ensure Supabase Storage buckets (`avatars`, `memories`) are created and RLS policies are applied.
- [ ] Retrieve Prod `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Azure (AI & Content Safety)
- [ ] Provision a dedicated Production Azure OpenAI Service.
- [ ] Deploy the Chat model (e.g., `gpt-4o-mini`) and Embedding model (`text-embedding-3-large`).
- [ ] Provision Azure AI Content Safety and configure strict toxicity thresholds.
- [ ] Retrieve `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and Content Safety keys.

### Backend Application (Render / Vercel)
- [ ] Provision the production environment for the NestJS API.
- [ ] Inject all environment variables (Supabase, Azure, Sentry, PostHog, Stripe/Apple IAP keys).
- [ ] Ensure SSL/TLS is enforced.
- [ ] Verify `npm run start:prod` executes successfully.

## 2. App Store Submission Notes

To successfully pass the Apple App Store and Google Play Store reviews, the following must be strictly adhered to:

### Rating and Age Gating
- **Rating:** Must be marked as 17+ / 18+ (Dating App classification).
- **Age Gate:** The phone auth flow MUST block any user under 18. Do not rely on self-reporting if possible, but at minimum have a strict DOB check.

### Privacy Nutrition Labels
- **Data Collected:** Phone Number, Location (Precise for Venues, Coarse otherwise), User Content (Photos, Bios, Chat Logs - clearly state ephemeral nature of Dark Room), Diagnostics (Crash Data).
- **Data Linked to User:** Yes.
- **Tracking:** No (if not using third-party ad networks).

### Safety & Reporting Disclosures
- **EULA:** Provide a clear End User License Agreement specifying zero tolerance for objectionable content.
- **Reporting Mechanism:** Ensure the "Report User" and "Unmatch" buttons are prominently accessible on profiles and in chat.
- **Blocking:** Ensure blocking a user immediately severs all communication and hides profiles mutually.

## 3. Incident & Moderation On-Call Plan

### Moderation
- **Tier 1 (Automated):** Azure Content Safety instantly blocks/flags highly toxic messages.
- **Tier 2 (Manual Review):** Messages flagged (but not blocked) are sent to the Admin Dashboard. An on-call moderator must review the queue daily.
- **SLA:** Critical abuse reports must be reviewed within 2 hours.

### Technical Incidents
- **Monitoring:** Sentry alerts configured for critical API crashes. PostHog configured for sudden drops in signup conversion.
- **On-Call Rotation:** Establish a PagerDuty (or equivalent) rotation for the backend API and database.
- **Severity Levels:**
  - **SEV-1 (System Down):** App cannot be opened, matching broken, database inaccessible. Page immediately.
  - **SEV-2 (Feature Degraded):** Coach is offline, push notifications delayed. Next business day.

## 4. Rollback Procedure

If a severe bug is discovered immediately post-launch:

### API / Backend Rollback
1. Navigate to the hosting provider (Render/Vercel) deployments list.
2. Select the previous stable deployment hash.
3. Click "Rollback" or "Redeploy".
4. Monitor Sentry to ensure error rates drop.

### Database Rollback
*Note: Rolling back database schemas is highly destructive.*
1. If a migration corrupted data but the schema is intact, use Point-in-Time Recovery (PITR) in the Supabase Dashboard to restore the database to the exact minute before the deploy.
2. If the schema is broken, run the specific down-migrations locally against the prod URL (not recommended unless strictly necessary).
3. Always take a manual snapshot before applying major migrations.

### Mobile App Rollback
1. **OTA (Over-The-Air):** If using Expo EAS Update, publish a rollback to the previous update channel: `eas update --branch production --message "Rollback to stable"`.
2. **App Store:** Expedite a hotfix review. Apple does not allow rolling back binaries to previous versions; a new build with incremented version number must be submitted.
