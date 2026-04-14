# NexoPost

NexoPost is a Next.js 16 + React 19 application with Prisma/MySQL backing store.

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+ (or compatible)

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Create environment files:

```bash
cp .env.example .env
cp .env.example .env.local
```

3. Fill required values in `.env` (at minimum):

- `AUTH_SECRET`
- `DATABASE_URL`
- `APP_BASE_URL`

4. Apply Prisma migrations:

```bash
npx prisma migrate dev
```

5. Start development server:

```bash
npm run dev:3001
```

App runs at `http://127.0.0.1:3001`.

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
- `DATABASE_URL`
- `APP_BASE_URL` (or valid `NEXTAUTH_URL` / `NEXOPOST_APP_URL`)

### Optional Integrations

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Cloudinary: `CLOUDINARY_*`
- Social OAuth providers: Twitter/LinkedIn/Facebook/Instagram/TikTok/YouTube/Pinterest keys
- Microsoft mailbox + support notifications: `MICROSOFT_*`, `SUPPORT_NOTIFICATION_EMAIL`
- Access control helpers: `ADMIN_EMAILS`, `SUPERADMIN_EMAILS`
- Scheduled publish API: `CRON_SECRET`

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
