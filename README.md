# NexoPost

NexoPost is a Next.js 16 + React 19 application backed by Prisma and Neon Postgres, deployed on Vercel (fra1).

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- npm 10+
- Vercel CLI, logged in and linked to `serkangunacti-nexopost`

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Run the app with the project's Development environment variables injected by
   Vercel. Nothing is written to disk, so no plaintext secrets end up in the
   (Google Drive) working folder. The Development environment needs its own Neon
   branch (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`) and `ENCRYPTION_KEY` first;
   Neon is connected to Production and Preview only.

```bash
vercel env run -- npm run dev:3001
```

App runs at `http://127.0.0.1:3001`.

## Database

- Neon Postgres, provisioned through the Vercel Marketplace integration.
- Schema lives in `prisma/schema.prisma`; migrations in `prisma/migrations`.
- `npm run vercel-build` (used by Vercel) runs `prisma migrate deploy` before
  building, so pushing a new migration applies it on deploy.
- Create new migrations against the Development Neon branch, never production:

```bash
vercel env run -- npx prisma migrate dev --name <change>
```

## Secrets

- Every OAuth token, refresh token, page token, Bluesky session and PKCE verifier
  is encrypted with AES-256-GCM (`src/lib/secrets.ts`) before it is stored.
- `ENCRYPTION_KEY` (32 bytes, base64) must be set as a Sensitive Vercel
  environment variable. Rotating it requires re-connecting social accounts.

## Payments

No payment company is contracted yet. `NEXT_PUBLIC_PAYMENT_PROVIDER=test` (the
default) approves every charge so the full plan flow can be tested; payments are
recorded in the `payments` table with provider `test`. Card fields are UI only and
are never sent to the server.

## Common Commands

```bash
npm run dev
npm run dev:3001
npm run build
npm run start
npm run lint
```

## Environment Variables

See `.env.example` for the full list.

### Required

- `AUTH_SECRET`
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (Neon integration)
- `ENCRYPTION_KEY`
- `APP_BASE_URL` (or valid `NEXTAUTH_URL` / `NEXOPOST_APP_URL`)

### Optional Integrations

- Cloudinary: `CLOUDINARY_*`
- Social OAuth providers: Twitter/LinkedIn/Facebook/Instagram/TikTok/YouTube/Pinterest keys
- Microsoft mailbox + support notifications: `MICROSOFT_*`, `SUPPORT_NOTIFICATION_EMAIL`
- Access control helpers: `ADMIN_EMAILS`, `SUPERADMIN_EMAILS`
- Scheduled publish API: `CRON_SECRET` (also stored as a GitHub Actions secret; the
  `publish-scheduled` workflow calls the endpoint every 5 minutes)

## Notes For Network Drives

If the project is on a network share and Git shows permission-only changes, keep this local setting:

```bash
git config core.filemode false
```

Project is configured to use `.next_runtime` as Next.js `distDir`, so regular build/dev output does not rely on the default `.next` folder.

If macOS metadata files appear (`._*`, `.DS_Store`), remove them:

```bash
find . \( -name '._*' -o -name '.DS_Store' \)
```

## Additional Docs

- [Production Security Smoke Checklist](docs/production-security-smoke-checklist.md)
- [Callback Cleanup Checklist](docs/callback-cleanup-checklist.md)
