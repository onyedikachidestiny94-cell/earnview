---
name: "Monetag Rewarded Ads Integration"
about: "Integrate Monetag rewarded VAST with video.js + IMA and add server audit/verification skeleton"
labels: feature
assignees: []
---

## Summary

This PR adds a Monetag-ready rewarded ad integration for the frontend and a server-side audit/verification skeleton to prepare for secure reward granting.

## Changes

Frontend
- Added `artifacts/earnview/src/components/RewardedPlayer.tsx` — a wrapper around video.js + videojs-ima that requests a VAST tag on user action and emits ad-complete / ad-error events.
- Wired task-detail to use the RewardedPlayer so users can click "Watch to earn", watch the ad, and then claim reward after ad completion.
- Uses env var `VITE_MONETAG_VAST` for the ad tag. The branch defaults to a safe public test VAST tag for development.

Backend
- Added `artifacts/api-server/src/routes/ads.ts` — POST `/api/ads/verify` endpoint that records an `ads_audit` row and returns success. When Monetag verification credentials are available this endpoint will perform server-to-server verification before crediting.

Database
- Added SQL snippet to create `ads_audit` table (see `deploy/ads_audit.sql`).

Docs
- Added `docs/monetag-integration.md` with local testing steps, Netlify env variables, and deployment checklist.

## How to test locally
See `docs/monetag-integration.md`. In short:
1. pnpm install
2. Start backend with dev envs set
3. Start frontend with `VITE_MONETAG_VAST` set to the test tag and run dev
4. Open a task page and click Watch to earn → verify ad shows and Claim works

## Netlify / Deploy
Set the following Netlify env vars before deploying:
- `VITE_MONETAG_VAST` (replace the test tag with Monetag production tag before going live)
- `VITE_API_BASE` (your backend base URL)
- `VITE_CLERK_PUBLISHABLE_KEY`

Backend env variables:
- `DATABASE_URL`, `CLERK_SECRET_KEY`
- (optional) `MONETAG_VERIFY_URL`, `MONETAG_API_KEY` — for server-to-server verification

## Migration
Run the SQL in `deploy/ads_audit.sql` against your production DB to create the `ads_audit` table.

---
