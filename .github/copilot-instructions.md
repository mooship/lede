# Copilot Instructions — Tidel

Tidel is a daily news digest monorepo. A Cloudflare Worker fetches RSS feeds, curates ~15 stories with Claude Sonnet, and persists them to Neon PostgreSQL. A React/Vite frontend reads from the same API via tRPC.

## Commands

```bash
# All workspaces
npm run dev          # wrangler dev + vite concurrently
npm run build        # full build
npm run test         # all tests
npm run lint         # Biome --write
npm run typecheck    # tsc --noEmit everywhere

# Single workspace
npm run test --workspace=apps/api
npm run test --workspace=apps/web

# Single test file
cd apps/api && npx vitest run src/pipeline.test.ts

# API worker only
cd apps/api && npm run dev     # wrangler dev on :8787
cd apps/api && npm run deploy  # deploy to production

# Web only
cd apps/web && npm run dev     # vite on :5173

# DB migrations (run from packages/db)
cd packages/db && npx drizzle-kit generate
cd packages/db && npx drizzle-kit migrate
```

## Architecture

```
packages/tsconfig   — shared TS configs (base, node, react, worker)
packages/db         — Drizzle schema + createDb factory (Neon HTTP)
packages/api        — shared types only: Story, Category, AppRouter
apps/api            — Cloudflare Worker: Hono + tRPC + pipeline
apps/web            — React + Vite + TanStack Router frontend
```

Build order matters: `tsconfig` → `db` → `api` → `apps/api` → `apps/web`.

`apps/web` depends on `@tidel/api` for shared types but never imports from `@tidel/db`.

### Pipeline (`apps/api/src/pipeline.ts`)

`buildEdition(env)` runs on a daily cron at 04:00 UTC:
1. Idempotency check — query `editions` for today's SAST date; skip if already built
2. Fetch all RSS feeds via `Promise.allSettled` (failures are skipped)
3. Filter junk — regex patterns for promos, coupons, sponsored content
4. Deduplicate — normalise titles, drop substring matches
5. Curate — single Claude prompt picks ~15 stories (min 2, max 5 per category); fallback sorts by source-overlap score then `pubDate`
6. Summarise — `Promise.all` to Claude Sonnet (~150 words, British English); fallback uses raw RSS description
7. Persist — sequential `db.insert` for `editions` then `stories` (no transactions — Neon HTTP limitation)

### tRPC Router (`apps/api/src/router.ts`)

- `edition.today` — public query; returns today's stories or the latest edition if today hasn't been built; has a 5 s timeout guard
- `edition.build` — protected mutation; requires `Authorization: Bearer <ADMIN_SECRET>`

Auth uses `crypto.subtle.timingSafeEqual` in `context.ts`.

### Web client (`apps/web`)

- TanStack Router with file-based routing in `src/routes/`
- `routeTree.gen.ts` is auto-generated — do not edit; commit it after adding routes
- `trpc.edition.today.useQuery()` with `staleTime: 1 hour` — all story routes share this cached fetch
- Story detail at `/story/$id` reads from the same cached query result

## Environment Variables

**`apps/api/.dev.vars`** (gitignored, for local wrangler dev — copy from `.dev.vars.example`):
```
DATABASE_URL=<neon dev branch connection string>
ANTHROPIC_API_KEY=<optional>
ADMIN_SECRET=<strong random string, min 32 chars — enforced by Zod at runtime>
WEB_ORIGIN=http://localhost:5173
```
`ANTHROPIC_API_KEY` is optional — the pipeline falls back to raw RSS descriptions without it.

**`apps/web/.env.development`** (committed):
```
VITE_API_URL=http://localhost:8787
VITE_APP_URL=http://localhost:5173
```

## DB Schema

Two tables (`packages/db/src/schema.ts`):
- `editions(date PK, built_at)` — one row per daily edition
- `stories(id uuid PK, edition_date FK → editions.date, title, description, summary, category, link, pub_date, source, position)` — cascade-deletes with edition; indexes on `edition_date` and `category`; unique constraint on `link`

`createDb(connectionString)` uses `drizzle-orm/neon-http`. No transactions, no connection pooling.

## Styling (PandaCSS)

- All styles via `css()` imported from `../../styled-system/css`
- `styled-system/` is generated — never edit it; run `panda codegen --silent` or just `npm run dev`
- Token names are camelCase in config but become kebab-case CSS vars: `textMuted` → `--colors-text-muted`
- For dynamic runtime values (e.g., category colour in a `style={}` prop), use `CATEGORY_CSS_VAR` from `src/categories.ts`: `style={{ borderColor: CATEGORY_CSS_VAR[category] }}`
- The `storyCard` recipe in `panda.config.ts` handles hover state — no hover `useState` needed

**Category accent tokens:** `world`, `tech`, `science`, `business`, `sport`  
**Font tokens:** `display` (Syne Variable), `body` (Instrument Serif)

## Testing Conventions

- **API tests:** vitest, `node` environment, mock Anthropic SDK with `vi.mock()`
- **Web tests:** vitest + happy-dom + `@testing-library/react`; **no `@testing-library/jest-dom`** — use native vitest matchers (`not.toBeNull()`, `.textContent`, `.getAttribute()`)
- `@tanstack/react-router`'s `Link` and `createFileRoute` must be mocked in component tests that render without a `RouterProvider`

## Key Gotchas

- **Turbo v2** uses `tasks` in `turbo.json`, not `pipeline`
- **Neon HTTP** does not support transactions — always use sequential inserts
- **Wrangler local dev** lacks `DOMParser` — XML parsing uses `fast-xml-parser`, not browser APIs
- **CORS** origin in Hono uses `resolveCorsOrigin(origin, c.env.WEB_ORIGIN)`; `WEB_ORIGIN` supports comma-separated URLs
- **`ADMIN_SECRET`** must be at least 32 characters — enforced by Zod (`validateEnv`) on every request
- **Cloudflare subrequest budget** (free plan: 50/invocation): 22 RSS feeds + 15 Claude summarise calls + 1 curation call + 3 Neon calls ≈ 41 total — don't add feeds without checking this

## Library Docs

When working with any third-party library or package (Drizzle, Hono, tRPC, TanStack Router, TanStack Query, PandaCSS, Vitest, Wrangler, Vite, Biome, etc.), use the **context7** MCP tool to fetch up-to-date documentation before writing or modifying code that uses that library.

## Linter / Formatter

Biome (`biome.json` at root): single quotes, `asNeeded` semicolons, 2-space indent, 100-char line width.  
Ignored paths: `node_modules`, `dist`, `styled-system`, `migrations`, `.wrangler`, `routeTree.gen.ts`.

```bash
biome check --write .   # fix
biome check .           # check only
```

Lefthook runs `biome check --write` on staged files as a pre-commit hook. It is installed automatically via the `prepare` script on `npm install`.
