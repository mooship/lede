# Lede

A daily news digest. Each morning at 06:00 SAST, a Cloudflare Worker fetches RSS feeds across four categories, summarises each story with Claude Haiku, and publishes a fixed 12-story edition. The frontend presents the edition as a newspaper-style grid with full story detail pages.

## Stack

| Layer | Technology |
|---|---|
| Worker | Cloudflare Workers + Hono + tRPC |
| Database | Neon (PostgreSQL, serverless HTTP) |
| ORM | Drizzle |
| Summarisation | Anthropic Claude Haiku (prod) / Google Gemini Flash Lite (local dev and fallback) |
| Auth | Clerk |
| Frontend | React + Vite + TanStack Router |
| Monorepo | Turborepo + npm workspaces |
| Linter | Biome |

## Workspaces

```
apps/api      — Cloudflare Worker (RSS pipeline + tRPC API)
apps/web      — React frontend
packages/db   — Drizzle schema and db factory
packages/api  — Shared types (Story, Category)
packages/tsconfig — Shared TypeScript configs
```

## Local development

```bash
npm install
npm run dev   # wrangler dev on :8787 + vite on :5173
```

`apps/api/.dev.vars` and `apps/web/.env.development` are already configured for local dev. For AI summaries in local dev, add a `GEMINI_API_KEY` to `apps/api/.dev.vars` (free tier, uses `gemini-2.0-flash-lite`). Set `ANTHROPIC_API_KEY` instead to use Claude Haiku. Without either key, the raw RSS description is used.

## Database migrations

Migrations live in `packages/db/migrations/` and are already applied to both the dev and production Neon branches. You only need to touch this if you change the schema in `packages/db/src/schema.ts`.

When you change the schema:

```bash
cd packages/db

# 1. Generate a new migration file from your schema changes
npx drizzle-kit generate

# 2. Apply it to the dev Neon branch (DATABASE_URL must be the dev connection string)
DATABASE_URL="<dev connection string>" npx drizzle-kit migrate

# 3. Before deploying, apply it to the production Neon branch too
DATABASE_URL="<prod connection string>" npx drizzle-kit migrate
```

`generate` creates a SQL file in `migrations/` — commit this file alongside your schema change. `migrate` runs any unapplied SQL files against the target database. You run `migrate` twice (once per branch) but only `generate` once.

## Deployment

### Worker (Cloudflare Workers)

Fill in `apps/api/.secrets.production.json` with production credentials, then:

```bash
cd apps/api && npm run deploy
```

This uploads the secrets to Cloudflare and deploys the worker in one step. The worker runs at `https://lede-api.<your-subdomain>.workers.dev` and is configured to rebuild the edition daily at 06:00 SAST via a cron trigger.

### Frontend (Cloudflare Pages)

Fill in `apps/web/.env.production`:

```
VITE_API_URL=https://lede-api.<your-subdomain>.workers.dev
VITE_CLERK_PUBLISHABLE_KEY=<clerk production publishable key>
```

Then build and deploy:

```bash
cd apps/web && npm run build
# upload dist/ to Cloudflare Pages
```

If you connect the Pages project to this git repository, set `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` as environment variables in the Cloudflare Pages dashboard instead — the local `.env.production` file is not accessible during CI builds.

## Other commands

```bash
npm run build       # full monorepo build
npm run test        # vitest across all packages
npm run lint        # biome check --write
npm run typecheck   # tsc --noEmit across all packages
```

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).

AGPL-3.0 requires that any modified version served over a network must make its source code available to users of that service.
