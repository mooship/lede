# CLAUDE.md

## What is Tidel

A daily news digest that fetches RSS feeds across six categories, summarises each story with Claude, and publishes a morning edition (~12 stories, 06:00 UTC) and afternoon edition (~12 stories, 15:00 UTC) via Cloudflare Worker cron triggers.

## Safety

- **Never deploy to production (`wrangler deploy`) or run database migrations (`drizzle-kit migrate`) without explicit permission from the user.** Always ask first and wait for confirmation. This applies to both dev and production environments.

## Monorepo structure

```
packages/tsconfig   — shared TS configs (base, node, react, worker)
packages/db         — Drizzle schema + createDb factory (Neon serverless HTTP)
packages/api        — shared types (Story, Category, AppRouter) + schedule utilities (msUntilNextEdition, secondsUntilNextEdition)
apps/api            — Cloudflare Worker: Hono + tRPC + pipeline
apps/web            — React + Vite + TanStack Router frontend
```

Build order matters: `tsconfig` → `db` → `api` → `apps/api` → `apps/web`

## Commands

> **IMPORTANT — always use Moon** for lint, build, test, and typecheck. Do NOT run `npm run` scripts directly in workspaces, do NOT run `npx vitest` or `npx tsc` directly. Moon sets up the correct environment and runs tasks in dependency order. The only exceptions are the per-workspace `dev` and `deploy` commands listed below, which have no Moon equivalent.

> **Before running any command**, ensure dependencies are installed: `npm install`

> **Moon on Windows** runs tasks via PowerShell, which does not add `node_modules/.bin` to PATH automatically. All per-project `moon.yml` task commands use `npx` prefixes (e.g. `npx vitest run`, `npx tsc --noEmit`) to work around this. Do not remove `npx` prefixes from moon.yml commands.

> **Moon requires internet on first run** to cache its WASM plugins. If Moon is unavailable (no network, WASM error), you may fall back to these direct commands only as a last resort:
> - **Lint**: `./node_modules/.bin/biome check .` (from repo root)
> - **Typecheck** (`apps/api`): `cd apps/api && npx tsc --noEmit`
> - **Typecheck** (`apps/web`): `cd apps/web && npx panda codegen --silent && npx tsc --noEmit`
> - **Test** (`apps/api`): `cd apps/api && npx vitest run`
> - **Test** (`apps/web`): `cd apps/web && npx vitest run`
> Running `npx vitest run` from the repo root does NOT work — it ignores per-workspace vitest configs and will produce false failures.

```bash
# All workspaces — always prefer these
moon run :build
moon run :test
moon run :lint        # Biome --write
moon run :typecheck

# npm run shortcuts (delegate to Moon)
npm run build
npm run test
npm run lint
npm run typecheck

# Single test file (Moon has no single-file mode — this is the only exception)
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

# Web deploy (includes uploading ADMIN_SECRET from .secrets.web.json)
cd apps/web && npm run deploy
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
# runs: npm run build && wrangler secret bulk .secrets.web.json --config wrangler.deploy.jsonc && wrangler deploy --config wrangler.deploy.jsonc
```

`apps/web/.secrets.web.json` (gitignored) holds secrets for the web Worker, deployed via `wrangler secret bulk`. Add any secrets the web Worker needs (e.g. `ADMIN_SECRET` for the server-side admin proxy).

`API_URL` is already set in `wrangler.deploy.jsonc`. For `VITE_API_URL` and `VITE_APP_URL` (used by the client bundle), set them as Cloudflare Worker environment variables in the dashboard or add them to `apps/web/.env.production` before building.

## Architecture

### Pipeline (`apps/api/src/pipeline.ts`)

`buildEdition(env)` runs on each cron trigger:
1. Idempotency check — query `editions` table for today's UTC date + slot; return early if row exists
2. Fetch all feeds via `Promise.allSettled` (failures are logged and skipped)
3. Filter junk — regex patterns for promo codes, coupons, sponsored content
4. Deduplicate — normalise titles (lowercase, strip punctuation), drop substring matches
5. Select — single cross-category Claude prompt picks ~15 stories total (min 2, max 5 per category); Claude decides the split based on newsworthiness. Fallback (no API key): top stories per category sorted by `pubDate`
6. Summarise — batched in groups of 4 (`runBatched`) → Anthropic `claude-haiku-4-5-20251001` if `ANTHROPIC_API_KEY` set, else raw RSS description. 50–200 words, British English. Curation uses `claude-sonnet-4-6`.
7. Persist — sequential `db.insert` for `editions` then `stories` (neon-http has no transaction support)

### tRPC router (`apps/api/src/router.ts`)

- `edition.today` — public query, returns `Story[] | null` for today's UTC date; has a 5 s timeout guard
- `edition.list` — public query, returns `{ date, slot, storyCount }[]` for all editions
- `edition.byDate` — public query, returns `Story[] | null` for a specific date + slot; immutable (7-day cache)
- `edition.adminStatus` — protected query, returns per-slot feed and category stats for the latest date
- `edition.build` — protected mutation, triggers `buildEdition` via `waitUntil`; idempotent
- `story.byId` — public query, returns a single `Story` by UUID; immutable (7-day cache)
- `story.search` — public query, ILIKE with explicit `ESCAPE '\\'` so `%` and `_` in user input are treated as literals

Auth is a static secret: `Authorization: Bearer <ADMIN_SECRET>` header, verified in `context.ts` using `crypto.subtle.timingSafeEqual`. `ADMIN_SECRET` must be at least 32 characters (enforced by Zod's `validateEnv`, which runs once per isolate and is cached thereafter).

To trigger a build manually via curl, send the input as a plain JSON object (no tRPC `json` wrapper):
```bash
curl -X POST https://api.tidel.app/trpc/edition.build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -d '{"slot":"morning"}'
```

### Feed endpoints (`apps/api/src/index.ts`)

- `GET /atom.xml` — Atom 1.0 feed
- `GET /rss.xml` — RSS 2.0 feed

Both support a `?slot=morning` or `?slot=afternoon` query parameter. Without a slot, the combined daily feed is returned (morning + afternoon stories). Entry dates use `edition.built_at` — the time Tidel published the edition — not the source article's `pubDate`. Cache-Control: `s-maxage` set to `secondsUntilNextEdition()`, `stale-while-revalidate=86400`.

### Caching (`apps/api/src/index.ts`)

tRPC routes use `trpcCacheMiddleware(getSecs)` which sets `Cache-Control` by parsing the tRPC response body after the handler runs — only when the result is non-null/non-empty. `edition.today` and `edition.list` use `secondsUntilNextEdition()` as the TTL. `edition.byDate` and `story.byId` use 7 days (immutable once written). `buildEdition` calls `purgeEditionCache` (Cloudflare `purge_everything`) on success, so long TTLs are safe — the cache is always cleared when new content arrives.

### Web client (`apps/web`)

- **TanStack Start** (SSR) with `@cloudflare/vite-plugin` — renders server-side on a Cloudflare Worker, not a static SPA
- TanStack Router with file-based routing (`src/routes/`)
- `routeTree.gen.ts` is auto-generated by the Vite plugin — do not edit manually; commit it after adding new routes
- tRPC client batches requests via `httpBatchLink` to the API; server-side uses `API_URL` env var, client-side uses `VITE_API_URL`
- Data fetching uses TanStack Start `createServerFn` loaders — SSR calls go via `createServerTrpcCaller()`, pages read data with `Route.useLoaderData()`
- Index page calls `edition.today.query({ slot })`; schedules `router.invalidate()` via `setTimeout(msUntilNextEdition())` when the next edition is due
- Story detail page (`/story/$id`) calls `story.byId.query(id)` via its own server fn loader
- Admin page (`/admin`) uses `createServerFn` proxies to call the API with the admin secret server-side — the secret never reaches the browser. The web Worker must have `ADMIN_SECRET` in its environment (via `.secrets.web.json`).

### Styling (PandaCSS)

- Use `css()` from `../../styled-system/css` for all styles. `styled-system/` is generated — run `panda codegen --silent` (or just `npm run dev`/`npm run build`, which do it automatically). Do not edit anything inside `styled-system/`.
- `styled-system/` is gitignored and generated at build time — `panda codegen --silent` runs before `tsc` and `vite` in every script. The `prepare` hook also runs it on `npm install`.
- Token names use camelCase in config but become kebab-case CSS vars (e.g. `textMuted` → `--colors-text-muted`). Use the token name in `css()` calls and the CSS var string in `style={}` props via `CATEGORY_CSS_VAR`.
- Tokens are defined in `apps/web/panda.config.ts` — colors (`bg`, `surface`, `border`, `textPrimary`, `textMuted`, etc.) and fonts (`display` = Syne, `body` = Plus Jakarta Sans Variable). Category accent colours are `world`, `tech`, `science`, `business`, `sport`.
- `CATEGORY_CSS_VAR` in `src/categories.ts` maps each category to its CSS variable string (e.g. `var(--colors-world)`) for use in `style={}` props where a dynamic runtime value is needed alongside a static `className`.
- `storyCard` recipe in `panda.config.ts` handles hover state and category border colour — no hover `useState` needed in cards.

### DB schema (`packages/db/src/schema.ts`)

- `editions(date, slot PK, built_at, feed_stats)`
- `stories(id uuid PK, edition_date+edition_slot FK, title, description, summary, category, link, pub_date, source, position)` — indexes on `(edition_date, edition_slot)` and `category`; unique constraint on `(link, edition_date, edition_slot)`; GIN trigram indexes on `title` and `summary` for ILIKE search
- `story.position` is 0-indexed — display as `story.position + 1`

`createDb(connectionString)` uses `drizzle-orm/neon-http` — no transactions, no connection pooling.

### RSS source feeds (`apps/api/src/config.ts`)

Six categories: World, Technology, Science, Business/Economy, Sport, Culture. Feed count is deliberately capped to stay within Cloudflare Workers' free-plan subrequest limit (50 per invocation). The budget is roughly: 27 feeds + 15 Claude summarisation calls + 1 curation call + 3 Neon HTTP calls = ~46 subrequests. Do not add feeds without checking the budget.

## Testing

Web tests (`apps/web`) use vitest + happy-dom with `@testing-library/react`. No `@testing-library/jest-dom` — use native vitest matchers (`not.toBeNull()`, `.textContent`, `.getAttribute()`) instead of jest-dom matchers.

`@tanstack/react-router`'s `Link` and `createFileRoute` must be mocked in tests that render components containing them without a `RouterProvider`.

`@tanstack/react-start`'s `createServerFn` makes real HTTP requests in a Vitest/happy-dom environment. Mock it with a builder that calls handlers directly:

```ts
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    type HandlerFn = (ctx: { data?: unknown }) => unknown
    const obj = {
      inputValidator: () => obj,
      handler: (fn: HandlerFn) => (ctx: { data?: unknown } = {}) => fn(ctx),
    }
    return obj
  },
}))
```

## Code style

- **No inline comments** — never use trailing `//` comments on the same line as code. JSDoc block comments (`/** */`) are fine where genuinely useful.
- **British English** in all user-visible copy.
- Biome (`biome.json` at root): single quotes, `asNeeded` semicolons, 2-space indent, 100 char line width. Ignored: `node_modules`, `dist`, `styled-system`, `migrations`, `.wrangler`.
- Run `biome check --write .` to fix; `biome check .` to check only.
- Lefthook runs `biome check --write` on staged files as a pre-commit hook. It is installed automatically via the `prepare` script on `npm install`.

## Key gotchas

### Database / Neon

- **Neon HTTP driver** does not support transactions — use sequential inserts
- **`drizzle-kit migrate` requires `ws` as an explicit dependency** — Node.js ships a native `WebSocket` global that `@neondatabase/serverless` auto-detects but which fails Neon's handshake silently. `drizzle.config.ts` sets `neonConfig.webSocketConstructor = ws` (the `ws` npm package) to override this. `ws` must be declared as a direct devDependency of `packages/db` — relying on it being hoisted from root as a transitive dependency is not sufficient.
- **After resetting the DB** (drop/recreate tables), migrations must be re-run with `drizzle-kit migrate` before the pipeline will work again
- **FK constraint during column type changes** — Postgres refuses to alter a column's type while a foreign key references it. Drop the FK first, run the type changes, then recreate it.

### Cloudflare Workers

- **Wrangler local dev** does not have `DOMParser` — XML parsing uses `fast-xml-parser`
- **CORS** — `resolveCorsOrigin` returns `null` (not `''`) for disallowed or missing origins. The Hono middleware in `src/cors.ts` reads `c.env.WEB_ORIGIN`; `WEB_ORIGIN` supports comma-separated URLs
- **Fontaine** is the `fontaine` npm package (unjs) — used for font fallback metric matching

## Library docs

When working with any third-party library or package (Drizzle, Hono, tRPC, TanStack Router, TanStack Query, PandaCSS, Vitest, Wrangler, Vite, Biome, etc.), use the **context7** MCP tool to fetch up-to-date documentation before writing or modifying code that uses that library.
