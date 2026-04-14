# Callback Cleanup Checklist

Canonical production domain:

- `https://www.nexopost.com`

Canonical app envs:

- `APP_BASE_URL=https://www.nexopost.com`
- `NEXOPOST_APP_URL=https://www.nexopost.com`
- `NEXTAUTH_URL=https://www.nexopost.com`

Repo status:

- No hard-coded `https://nexopost.com/api/social/callback/...` references remain in code.
- Remaining cleanup is in external provider dashboards only.

Use this order:

1. Confirm the provider still reconnects successfully with the `www` callback.
2. Remove the old `non-www` callback entry.
3. Re-run one quick reconnect smoke test.

Active providers to clean now:

## LinkedIn

Keep:

- `https://www.nexopost.com/api/social/callback/linkedin`

Remove after smoke test:

- `https://nexopost.com/api/social/callback/linkedin`

Panel:

- LinkedIn Developers
- App
- `Auth`
- `OAuth 2.0 redirect URLs`

## Facebook

Keep:

- `https://www.nexopost.com/api/social/callback/facebook`

Remove after smoke test:

- `https://nexopost.com/api/social/callback/facebook`
- any old Vercel preview callback that is no longer intentionally used for production login

Panel:

- Meta Developers
- App
- `Facebook Login for Business`
- `Settings`
- `Valid OAuth Redirect URIs`

## Instagram

Keep:

- `https://www.nexopost.com/api/social/callback/instagram`

Remove after smoke test:

- `https://nexopost.com/api/social/callback/instagram`
- any obsolete old Vercel production callback

Panel:

- Meta Developers
- App
- `Manage messaging & content on Instagram`
- `Set up Instagram business login`
- `Business login settings`

## YouTube

Keep:

- Origin: `https://www.nexopost.com`
- Redirect: `https://www.nexopost.com/api/social/callback/youtube`

Remove after smoke test:

- Origin: `https://nexopost.com`
- Redirect: `https://nexopost.com/api/social/callback/youtube`

Panel:

- Google Cloud Console
- `Google Auth Platform`
- `Clients`
- your web OAuth client

## TikTok

Keep:

- `https://www.nexopost.com/api/social/callback/tiktok`
- verified site URL based on `https://www.nexopost.com/`

Remove after smoke test:

- `https://nexopost.com/api/social/callback/tiktok`
- any legacy callback or URL prefix not in active use

Panel:

- TikTok Developer
- App
- Login/OAuth settings

## Bluesky

No external callback cleanup needed.

Notes:

- Bluesky uses our published client metadata and current app envs.
- As long as the app envs remain on `https://www.nexopost.com`, Bluesky is aligned.

Do not clean yet:

- Pinterest
- LinkedIn Company Pages
- X

Reason:

- Those flows are blocked, pending, or not yet finalized.
