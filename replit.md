# EarnView

A professional rewards platform where users earn money by completing sponsored tasks, watching promotional videos, and engaging with the platform. Features gamification (XP, levels, streaks, achievements), a referral program, wallet with withdrawals, leaderboard, and a full admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/earnview run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Replit Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + Recharts
- API: Express 5 + Clerk Auth (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit-managed Clerk (email/password + OAuth)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schema (users, tasks, completions, transactions, withdrawals, referrals, achievements, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers (users, dashboard, tasks, wallet, referrals, achievements, leaderboard, notifications, streak, admin)
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk auth middleware + JIT user provisioning
- `artifacts/api-server/src/lib/levelUtils.ts` — XP/level system (Beginner → Active → Pro → Elite)
- `artifacts/api-server/src/lib/achievements.ts` — Achievement checking and granting logic
- `artifacts/earnview/src/pages/` — All frontend pages
- `artifacts/earnview/src/App.tsx` — Clerk provider + wouter router setup

## Architecture decisions

- **Clerk auth** — Replit-managed Clerk handles email/password + OAuth. Backend uses `@clerk/express` middleware; frontend uses `@clerk/react` with cookie-based session (no manual token handling).
- **JIT user provisioning** — Local `users` table row is created on first authenticated API request using Clerk session claims (email, username).
- **Level system** — XP thresholds: Beginner (0–99), Active User (100–299), Pro User (300–699), Elite Member (700+).
- **Withdrawal flow** — Balance deducted immediately on request, refunded if admin rejects. Admin approves/rejects from the admin panel.
- **Achievement seeding** — 9 achievements seeded on first `/api/achievements` call via `ensureAchievementsSeedeed()`.

## Product

- **Task system** — Browse sponsored tasks, watch videos with countdown timer, claim rewards after required watch time (80% threshold).
- **Wallet** — Track balance, earnings by type, transaction history, submit withdrawal requests.
- **Gamification** — XP + level progression, daily streak with escalating bonuses, 9 achievement badges.
- **Referral program** — Unique referral code per user, $1 reward per successful referral via `/api/users/apply-referral`.
- **Leaderboard** — Daily/weekly/monthly rankings by earnings, tasks, referrals, or streak.
- **Admin panel** — Full CRUD on tasks, user management (suspend/unsuspend), withdrawal approve/reject.
- **PWA** — Web app manifest + service worker for installability.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing any `lib/*` schema before running artifact typechecks.
- Clerk proxy path is `/api/__clerk` — must remain mounted before body parsers in `app.ts`.
- After any OpenAPI spec change, run codegen before touching frontend hooks.
- Admin routes apply both `requireAuth` and `requireAdmin` middleware at the router level.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk setup and customization
