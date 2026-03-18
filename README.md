# Lede

A daily news digest. Each morning at 06:00 SAST, a Cloudflare Worker fetches RSS feeds across four categories, enriches each story with full article text, summarises with Claude Haiku, and publishes a 15-story edition. The frontend presents the edition as a newspaper-style grid with full story detail pages.

## Stack

| Layer | Technology |
|---|---|
| Worker | Cloudflare Workers + Hono + tRPC |
| Database | Neon (PostgreSQL, serverless HTTP) |
| ORM | Drizzle |
| Summarisation | Anthropic Claude Haiku (fallback: full article text, then RSS description) |
| Auth | Static `ADMIN_SECRET` bearer token |
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

`apps/api/.dev.vars` and `apps/web/.env.development` are already configured for local dev. Add an `ANTHROPIC_API_KEY` to `apps/api/.dev.vars` to enable Claude Haiku summaries. Without it, the full article text (or raw RSS description) is used as the summary.

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

`WEB_ORIGIN` can be a single URL or a comma-separated allowlist, for example:

```text
WEB_ORIGIN=https://lede.example.com,https://www.lede.example.com
```

This uploads the secrets to Cloudflare and deploys the worker in one step. The worker runs at `https://lede-api.<your-subdomain>.workers.dev` and is configured to rebuild the edition daily at 06:00 SAST via a cron trigger.

### Frontend (Cloudflare Pages)

Fill in `apps/web/.env.production`:

```
VITE_API_URL=https://lede-api.<your-subdomain>.workers.dev
```

Then build and deploy:

```bash
cd apps/web && npm run build
# upload dist/ to Cloudflare Pages
```

If you connect the Pages project to this git repository, set `VITE_API_URL` as an environment variable in the Cloudflare Pages dashboard instead — the local `.env.production` file is not accessible during CI builds.

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
