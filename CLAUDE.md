# CLAUDE.md

## What is Tidel

A daily news digest that fetches RSS feeds across six categories, summarises each story with Claude Haiku, and publishes a ~15-story morning edition and ~12-story afternoon edition per day. Morning builds at 04:00 UTC, afternoon at 12:00 UTC via Cloudflare Worker cron triggers.

## Monorepo structure

```
packages/tsconfig   — shared TS configs (base, node, react, worker)
packages/db         — Drizzle schema + createDb factory (Neon serverless HTTP)
packages/api        — shared types: Story, Category, AppRouter
apps/api            — Cloudflare Worker: Hono + tRPC + pipeline
apps/web            — React + Vite + TanStack Router frontend
```

Build order matters: `tsconfig` → `db` → `api` → `apps/api` → `apps/web`

## Commands

> **Before running any command**, ensure dependencies are installed: `npm install`

```bash
# All workspaces
npm run dev          # moon run :dev (starts wrangler dev + vite concurrently)
npm run build        # moon run :build
npm run test         # moon run :test
npm run lint         # moon run :lint (Biome --write)
npm run typecheck    # moon run :typecheck

# Single project (moon run <project>:<task>)
npx moon run api-worker:test
npx moon run web:test

# Single test file
cd apps/api && npx vitest run src/pipeline.test.ts

# API worker only
cd apps/api && npm run dev     # wrangler dev on :8787
cd apps/api && npm run deploy  # wrangler deploy to production

# Web only
cd apps/web && npm run dev     # vite on :5173

# DB migrations (run from packages/db)
cd packages/db && npx drizzle-kit generate

# Dev branch — DATABASE_URL from apps/api/.dev.vars
cd packages/db && DATABASE_URL="<dev url>" npx drizzle-kit migrate

# Production branch — DATABASE_URL from apps/api/.secrets.production.json
cd packages/db && DATABASE_URL="<prod url>" npx drizzle-kit migrate
```

## Environments

### Local dev

`apps/api/.dev.vars` — Wrangler reads this for local dev (gitignored):
```
DATABASE_URL=<neon dev branch connection string>
ANTHROPIC_API_KEY=<optional — used for summarisation>
ADMIN_SECRET=<strong random string, min 32 chars — enforced by Zod at runtime>
WEB_ORIGIN=http://localhost:5173
```

`apps/web/.env.development` is committed and sets:
```
VITE_API_URL=http://localhost:8787
VITE_APP_URL=http://localhost:5173
```
Use `apps/api/.dev.vars.example` as a reference if you need to recreate `.dev.vars`.

### Production

Fill in `apps/api/.secrets.production.json` (gitignored) with production credentials, then deploy:

```bash
cd apps/api && npm run deploy
# runs: wrangler secret bulk .secrets.production.json --env production && wrangler deploy --env production
```

The web app deploys as a Cloudflare Worker (SSR):

```bash
cd apps/web && npm run deploy
# runs: panda codegen --silent && vite build && wrangler deploy --config wrangler.deploy.jsonc
```

`API_URL` is already set in `wrangler.deploy.jsonc`. For `VITE_API_URL` and `VITE_APP_URL` (used by the client bundle), set them as Cloudflare Worker environment variables in the dashboard or add them to `apps/web/.env.production` before building.

## Architecture

### Pipeline (`apps/api/src/pipeline.ts`)

`buildEdition(env)` runs daily:
1. Idempotency check — query `editions` table for today's UTC date; return early if row exists
2. Fetch all feeds via `Promise.allSettled` (failures are logged and skipped)
3. Filter junk — regex patterns for promo codes, coupons, sponsored content
4. Deduplicate — normalise titles (lowercase, strip punctuation), drop substring matches
5. Select — single cross-category Claude prompt picks ~15 stories total (min 2, max 5 per category); Claude decides the split based on newsworthiness. Fallback (no API key): top stories per category by source score then `pubDate`
6. Summarise — `Promise.all` → Anthropic `claude-haiku-4-5-20251001` if `ANTHROPIC_API_KEY` set, else raw RSS description. ~200 words, British English. Curation uses `claude-sonnet-4-6`.
7. Persist — sequential `db.insert` for `editions` then `stories` (neon-http has no transaction support)

### tRPC router (`apps/api/src/router.ts`)

- `edition.today` — public query, returns `Story[] | null` for today's UTC date; has a 5 s timeout guard
- `edition.build` — protected mutation, checks Bearer token against `ADMIN_SECRET`

Auth is a static secret: `Authorization: Bearer <ADMIN_SECRET>` header, verified in `context.ts` using `crypto.subtle.timingSafeEqual`.

Builds run automatically via cron (04:00 UTC morning, 12:00 UTC afternoon). The build endpoint is idempotent — it skips if an edition already exists for that date and slot. To trigger manually via curl, send the input as a plain JSON object (no tRPC `json` wrapper):
```bash
curl -X POST https://api.tidel.app/trpc/edition.build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -d '{"slot":"morning"}'
```

### Web client (`apps/web`)

- **TanStack Start** (SSR) with `@cloudflare/vite-plugin` — renders server-side on a Cloudflare Worker, not a static SPA
- TanStack Router with file-based routing (`src/routes/`)
- `routeTree.gen.ts` is auto-generated by the Vite plugin — do not edit manually
- tRPC client batches requests via `httpBatchLink` to the API; server-side uses `API_URL` env var, client-side uses `VITE_API_URL`
- `trpc.edition.today.useQuery()` with `staleTime: 1 hour` — all story routes share this cached fetch
- Story detail page at `/story/$id` finds the story by ID from the same cached query result
- **Styling**: PandaCSS with a custom token set. Use `css()` from `../../styled-system/css` for all styles. `styled-system/` is generated — run `panda codegen --silent` (or just `npm run dev`/`npm run build`, which do it automatically). Do not edit anything inside `styled-system/`.
- **Tokens**: defined in `apps/web/panda.config.ts` — colors (`bg`, `surface`, `border`, `textPrimary`, `textMuted`, etc.) and fonts (`display` = Syne, `body` = Plus Jakarta Sans Variable). Category accent colours are `world`, `tech`, `science`, `business`, `sport`.
- **`CATEGORY_CSS_VAR`** in `src/categories.ts` maps each category to its CSS variable string (e.g. `var(--colors-world)`) for use in `style={}` props where a dynamic runtime value is needed alongside a static `className`.
- **`storyCard` recipe** in `panda.config.ts` handles hover state and category border colour — no hover `useState` needed in cards.

### DB schema (`packages/db/src/schema.ts`)

- `editions(date, slot PK, built_at, feed_stats)`
- `stories(id uuid PK, edition_date+edition_slot FK, title, description, summary, category, link, pub_date, source, position)` — indexes on `(edition_date, edition_slot)` and `category`; unique constraint on `(link, edition_date)`

`createDb(connectionString)` uses `drizzle-orm/neon-http` — no transactions, no connection pooling.

## RSS feeds (`apps/api/src/config.ts`)

Six categories: World, Technology, Science, Business/Economy, Sport, Culture. Feed count is deliberately capped to stay within Cloudflare Workers' free-plan subrequest limit (50 per invocation). The budget is roughly: 27 feeds + 15 Claude summarisation calls + 1 curation call + 3 Neon HTTP calls = ~46 subrequests. Do not add feeds without checking the budget.

## Testing

Web tests (`apps/web`) use vitest + happy-dom with `@testing-library/react`. No `@testing-library/jest-dom` — use native vitest matchers (`not.toBeNull()`, `.textContent`, `.getAttribute()`) instead of jest-dom matchers.

`@tanstack/react-router`'s `Link` and `createFileRoute` must be mocked in tests that render components containing them without a `RouterProvider`.

## Key gotchas

- **Moon** task runner — config lives in `.moon/workspace.yml`, `.moon/toolchain.yml`, and per-project `moon.yml` files. Run tasks with `moon run <project>:<task>` or `moon run :<task>` for all projects.
- **Neon HTTP driver** does not support transactions — use sequential inserts
- **Wrangler local dev** does not have `DOMParser` — XML parsing uses `fast-xml-parser`
- **Fontaine** is the `fontaine` npm package (unjs), not `vite-plugin-fontaine` (doesn't exist)
- **PandaCSS token names** use camelCase in config but become kebab-case CSS vars (e.g. `textMuted` → `--colors-text-muted`). Use the token name in `css()` calls and the CSS var string in `style={}` props via `CATEGORY_CSS_VAR`.
- **PandaCSS `styled-system/`** is gitignored and generated at build time — `panda codegen --silent` runs before `tsc` and `vite` in every script. The `prepare` hook also runs it on `npm install`.
- **CORS** origin callback in Hono uses `resolveCorsOrigin(origin, c.env.WEB_ORIGIN)` from `src/cors.ts`; `WEB_ORIGIN` supports comma-separated URLs
- **`ADMIN_SECRET`** must be at least 32 characters — enforced by Zod (`validateEnv`) on every request
- **After resetting the DB** (drop/recreate tables), migrations must be re-run with `drizzle-kit migrate` before the pipeline will work again
- **routeTree.gen.ts** is regenerated on every `vite dev` start — commit it after adding new routes

## Library docs

When working with any third-party library or package (Drizzle, Hono, tRPC, TanStack Router, TanStack Query, PandaCSS, Vitest, Wrangler, Vite, Biome, etc.), use the **context7** MCP tool to fetch up-to-date documentation before writing or modifying code that uses that library.

## Linter / formatter

Biome (`biome.json` at root). Config: single quotes, `asNeeded` semicolons, 2-space indent, 100 char line width. Ignored: `node_modules`, `dist`, `styled-system`, `migrations`, `.wrangler`.

Run `biome check --write .` to fix; `biome check .` to check only.

Lefthook runs `biome check --write` on staged files as a pre-commit hook. It is installed automatically via the `prepare` script on `npm install`.
