# Production Security Smoke Checklist

## Access Control

- Open the app in an incognito window and confirm `/api/media/upload` returns `401` or `403`.
- Open the app in an incognito window and confirm `/api/support-requests` returns `401` or `403`.
- Open the app in an incognito window and confirm `/api/superadmin/overview` returns `401` or `403`.
- Log in as `admin@nexopost.com` and confirm `/superadmin` is not accessible.
- Log in as `serkan@nexopost.com` and confirm `/superadmin` is accessible.

## Registration Hardening

- Register a brand-new email address and confirm the account lands on the free/default plan.
- Try registering with any previously seeded or privileged email and confirm it does not auto-upgrade the plan or role.
- Log in with an uppercase/mixed-case version of an existing email and confirm authentication still succeeds only for the same account.

## Media Upload Hardening

- Open DevTools on `/compose` and confirm there is no direct browser request to `api.cloudinary.com` during file upload.
- Upload an image and confirm the request goes to `/api/media/upload`.
- Upload a video and confirm the request goes to `/api/media/upload`.
- Try uploading a non-media file and confirm the server rejects it.

## Discount Code Integrity

- Apply a valid discount code in checkout and confirm the discount still works.
- Replay `/api/billing/checkout` from DevTools with a different `plan` or a tampered price field and confirm the charged amount in the `payments` table is computed server-side.
- Confirm a second paid purchase by the same account rejects discount codes.

## Token Encryption

- Connect any provider, then confirm `social_accounts.access_token` in Neon starts with `v1.` (ciphertext), not a raw token.
- Confirm `oauth_session_store.value` rows are ciphertext and the `oauth_pkce` cookie is not a raw verifier.

## Cron Protection

- Call `/api/cron/publish-scheduled` without the bearer token and confirm it returns unauthorized.
- Temporarily remove `CRON_SECRET` only in a safe non-production environment and confirm the endpoint fails closed instead of running.

## Superadmin Data Exposure

- Load `/api/superadmin/overview` as superadmin and confirm the response does not contain `accessToken` or `refreshToken` fields.
- Open the superadmin dashboard and confirm token values are not rendered anywhere in the UI.

## OAuth Callback Hygiene

- For each active provider, reconnect once and confirm there is no `redirect_uri_mismatch`:
  - LinkedIn
  - Facebook
  - Instagram
  - YouTube
  - TikTok
- After smoke tests pass, remove old `non-www` callback URLs from each provider dashboard.

## Final Manual Checks

- Hard refresh `/connections`, `/compose`, `/checkout`, `/support`, and `/superadmin`.
- Confirm browser console is clean of new auth/upload errors.
- Confirm production domain remains `https://www.nexopost.com`.
