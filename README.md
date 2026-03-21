# Tidel

A daily news digest. Cloudflare Worker crons build a morning edition at 06:00 UTC and an afternoon edition at 15:00 UTC, fetching RSS feeds across five categories and summarising each story with Claude. The frontend presents each edition as a newspaper-style grid with full story detail pages.

## Stack

| Layer | Technology |
|---|---|
| Worker | Cloudflare Workers + Hono + tRPC |
| Database | Neon (PostgreSQL, serverless HTTP) |
| ORM | Drizzle |
| Summarisation | Anthropic Claude Haiku (fallback: raw RSS description) |
| Curation | Anthropic Claude Sonnet |
| Auth | Static `ADMIN_SECRET` bearer token |
| Frontend | React + TanStack Start (SSR) + TanStack Router |
| Monorepo | Moon + npm workspaces |
| Linter | Biome |

## Workspaces

```
apps/api      — Cloudflare Worker (RSS pipeline + tRPC API)
apps/web      — TanStack Start SSR app (Cloudflare Worker)
packages/db   — Drizzle schema and db factory
packages/api  — Shared types (Story, Category)
packages/tsconfig — Shared TypeScript configs
```

## Local development

See [CONTRIBUTING](.github/CONTRIBUTING.md) for full setup instructions. The short version:

```bash
npm install
npm run dev   # wrangler dev on :8787 + vite on :5173
```

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
WEB_ORIGIN=https://tidel.app
```

This uploads the secrets to Cloudflare and deploys the worker in one step. The worker runs at `https://api.tidel.app` and is configured to build editions at 06:00 UTC (morning) and 15:00 UTC (afternoon) via cron triggers.

### Web (Cloudflare Workers — SSR)

The web app is a TanStack Start SSR application deployed as a Cloudflare Worker, not a static site. Set `VITE_API_URL` and `VITE_APP_URL` as Cloudflare Worker environment variables in the dashboard, or add them to `apps/web/.env.production` before building:

```
VITE_API_URL=https://api.tidel.app
VITE_APP_URL=https://tidel.app
```

Then build and deploy:

```bash
cd apps/web && npm run deploy
```

`API_URL` (used server-side) is already set in `wrangler.deploy.jsonc`. `VITE_API_URL` and `VITE_APP_URL` are embedded into the client bundle at build time.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).

AGPL-3.0 requires that any modified version served over a network must make its source code available to users of that service.
