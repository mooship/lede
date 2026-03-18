# Lede — Technical Spec

## Overview

A daily news reader that fetches RSS feeds across four categories, summarises each story to three sentences using Claude, and serves a fixed edition of 10 stories per day. The edition is built once at 06:00 SAST via a Cloudflare Cron Trigger and cached in Neon. Users read it; they do not refresh or configure it.

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/                  # React + Vite + TanStack Router + PandaCSS
│   └── api/                  # Hono + tRPC + Drizzle + Clerk (CF Worker)
├── packages/
│   ├── api/                  # Shared tRPC router types
│   ├── db/                   # Drizzle schema, migrations, client
│   └── tsconfig/             # Shared TS configs
├── turbo.json
├── package.json
└── .env                      # Root-level env for local dev
```

### Turborepo Pipeline (`turbo.json`)

```json
{
  "pipeline": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":       { "cache": false, "persistent": true },
    "lint":      {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

`turbo dev` runs Vite and Wrangler dev server concurrently.

---

## packages/tsconfig

Three configs:

- `base.json` — strict, `verbatimModuleSyntax`, `moduleResolution: "bundler"`, `target: "ES2022"`
- `react.json` — extends base, adds `jsx: "react-jsx"`
- `worker.json` — extends base, adds `lib: ["ES2022", "WebWorker"]`
- `node.json` — extends base, adds `lib: ["ES2022"]`, targets Node 22

Each app/package references the relevant one via `extends`.

---

## packages/db

### Tech

- Drizzle ORM + `drizzle-kit`
- Neon serverless driver (`@neondatabase/serverless`) — HTTP transport, no persistent TCP connection, compatible with the Workers runtime

### Schema

```ts
export const editions = pgTable('editions', {
  date:    date('date').primaryKey(),
  builtAt: timestamp('built_at').notNull(),
})

export const stories = pgTable('stories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  editionDate: date('edition_date').notNull().references(() => editions.date),
  title:       text('title').notNull(),
  summary:     text('summary').notNull(),
  category:    text('category').notNull(),
  link:        text('link').notNull(),
  pubDate:     text('pub_date'),
  source:      text('source').notNull(),
  position:    integer('position').notNull(),
})
```

### Exports

- `createDb(connectionString)` — factory function; Workers receive env bindings at request time, so the client cannot be a module-level singleton
- `schema` — all table definitions
- Type exports: `Edition`, `Story`, `NewStory`

### Migrations

Managed with `drizzle-kit`. Run `drizzle-kit generate` and `drizzle-kit migrate` against Neon from local. Migration files committed under `packages/db/migrations/`.

---

## packages/api

Shared tRPC router definition — types and router interface only. No implementation. Consumed by `apps/api` (implementation) and `apps/web` (client).

### Procedures

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `edition.today` | query | public | Returns today's `Story[]` or `null` |
| `edition.build` | mutation | Clerk (admin) | Triggers pipeline. Idempotent. |

### Types

```ts
export type Story = {
  id: string
  title: string
  summary: string
  category: Category
  link: string
  pubDate: string | null
  source: string
  position: number
}

export type Category =
  | 'World / Politics'
  | 'Technology'
  | 'Science'
  | 'Business / Economy'
```

---

## apps/api

### Tech

- Hono with `hono/cloudflare-workers` adapter
- `@hono/trpc-server`
- `@clerk/backend` for JWT verification
- `@anthropic-ai/sdk`
- `ofetch` as the fetch wrapper (Workers-compatible, auto JSON parsing, rich error objects)
- `DOMParser` for RSS XML parsing (Workers-native, no library needed)
- Wrangler for local dev and deployment

### Worker Entry Point

```ts
export default {
  fetch:     app.fetch,
  scheduled: handleCron,
}
```

### Wrangler Config (`wrangler.toml`)

```toml
name                   = "lede-api"
main                   = "src/index.ts"
compatibility_date     = "2024-01-01"

[triggers]
crons = ["0 4 * * *"]   # 04:00 UTC = 06:00 SAST

[vars]
BUILD_CRON_ENABLED = "true"
```

Secrets (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `CLERK_ADMIN_USER_ID`, `WEB_ORIGIN`) are set via `wrangler secret put`, never in `wrangler.toml`.

### Bindings Type

```ts
interface Env {
  DATABASE_URL:        string
  ANTHROPIC_API_KEY:   string
  CLERK_SECRET_KEY:    string
  CLERK_ADMIN_USER_ID: string
  WEB_ORIGIN:          string
  BUILD_CRON_ENABLED:  string
}
```

### Hono App

```ts
const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: c => c.env.WEB_ORIGIN }))
app.use('/trpc/*', trpcServer({
  router:        appRouter,
  createContext: ({ req, env }) => createContext(req, env),
}))
```

### tRPC Context

```ts
type Context = {
  userId: string | null
  env:    Env
}
```

`createContext` verifies the Clerk JWT from the `Authorization` header using `@clerk/backend`. `userId` is null for unauthenticated requests. `edition.build` rejects if `userId !== env.CLERK_ADMIN_USER_ID`.

### RSS Ingestion (`src/rss.ts`)

Uses `ofetch` with `responseType: 'text'` (RSS is XML, not JSON) and the Workers-native `DOMParser`.

```ts
async function fetchFeed(url: string): Promise<RssItem[]> {
  const text = await ofetch<string>(url, { responseType: 'text' })
  const doc  = new DOMParser().parseFromString(text, 'text/xml')
  return Array.from(doc.querySelectorAll('item')).map(item => ({
    title:       item.querySelector('title')?.textContent?.trim()       ?? '',
    description: item.querySelector('description')?.textContent?.trim() ?? '',
    link:        item.querySelector('link')?.textContent?.trim()        ?? '',
    pubDate:     item.querySelector('pubDate')?.textContent?.trim()     ?? '',
  }))
}
```

### Feed Config (`src/config.ts`)

```ts
export const FEEDS: Record<Category, string[]> = {
  'World / Politics':   [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.reuters.com/reuters/worldNews',
  ],
  'Technology':         [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
  ],
  'Science':            [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.reuters.com/reuters/businessNews',
  ],
}

export const STORIES_PER_CATEGORY = 3
export const TARGET_STORY_COUNT   = 10
```

### Build Pipeline (`src/pipeline.ts`)

Receives `env: Env` as a parameter — no module-level singletons.

**Step 1 — Idempotency check**

Query `editions` for today's date in SAST (`UTC+2`). Return early if a row exists.

**Step 2 — Fetch**

All feeds in parallel with `Promise.allSettled`. Log and skip any that reject.

**Step 3 — Deduplicate**

Normalise titles (lowercase, strip punctuation). Drop items whose normalised title is an exact or substring match of an already-seen item.

**Step 4 — Select**

Top `STORIES_PER_CATEGORY` per category by `pubDate` descending. Trim pool to `TARGET_STORY_COUNT` by dropping shortest descriptions.

**Step 5 — Summarise**

```ts
const summarised = await Promise.all(selected.map(s => summarise(s, env)))
```

Claude prompt:

```
You are a news summariser. Write an approximately 150-word summary of the following article.
Be factual and concise. Use British English spelling and grammar. Output only the summary, no preamble.

Title: {title}
Description: {description}
```

Model: `claude-haiku-4-5-20251001`. `max_tokens: 400`. 10 concurrent requests — within Anthropic's default rate limits.

**Step 6 — Persist**

Drizzle transaction: insert `editions` row, then all 10 `stories` rows with their `position` index.

### Cron Handler

```ts
async function handleCron(event: ScheduledEvent, env: Env): Promise<void> {
  if (env.BUILD_CRON_ENABLED !== 'true') return
  await buildEdition(env)
}
```

The `edition.build` tRPC mutation calls the same `buildEdition(env)` function — cron and manual trigger share identical logic.

### Cloudflare Worker CPU Limit

The default Workers CPU limit is 10ms per request on the free plan, but **50ms on paid**. The pipeline (10 fetch + 10 Claude calls) runs as a `scheduled` event, which has a **30-second wall time limit** — generous enough. For the HTTP handler (`edition.today`), a simple DB read is well within limits.

---

## apps/web

### Tech

- React 18 + Vite
- TanStack Router (file-based, with codegen)
- TanStack Query via `@trpc/react-query`
- PandaCSS + Park UI (component library built for PandaCSS, headless behaviour via Ark UI)
- Fontaine (Vite plugin)
- `@clerk/react`

### Routes

```
src/routes/
├── __root.tsx        # ClerkProvider, QueryClientProvider, outlet
└── index.tsx         # Today's edition
```

### Data Fetching

`trpc.edition.today.useQuery()` on the index route. `staleTime` computed as milliseconds until midnight SAST so the cache holds for the full day:

```ts
const msUntilMidnightSAST = () => {
  const now      = new Date()
  const midnight = new Date()
  midnight.setUTCHours(22, 0, 0, 0)          // 22:00 UTC = 00:00 SAST
  if (midnight <= now)
    midnight.setUTCDate(midnight.getUTCDate() + 1)
  return midnight.getTime() - now.getTime()
}
```

### UI States

| State | Condition | Display |
|---|---|---|
| `loading` | Query in-flight | Progress indicator |
| `not_ready` | `data === null` | "Today's edition isn't ready yet." + next build time |
| `ready` | `data` is `Story[]` | Full edition |
| `error` | Query error | Error message + retry |

### Component Structure

```
<Masthead />              # Title, date
<CategoryNav />           # All / World / Tech / Science / Business
<StoryList />
  <StoryCard />           # Collapsed: title + category
    <StorySummary />      # Expanded: 3 sentences + source link
```

`StoryCard` manages its own open/closed state.

### Sharing

Each expanded `StoryCard` includes a share action that passes the original article URL and title.

```ts
async function shareStory(title: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, url })
  } else {
    await navigator.clipboard.writeText(url)
    // show a brief "Link copied" toast
  }
}
```

Web Share API is used on mobile (native share sheet — covers WhatsApp, Telegram, etc.). On desktop where it is unavailable, the URL is copied to the clipboard and a toast confirms it. No per-story permalink is needed since the shared URL points to the original source article.

### Fonts

Loaded via Google Fonts:

- **Syne** (700, 800) — display font for headlines and the masthead. Geometric, bold, strong at large sizes on dark backgrounds.
- **Instrument Serif** (400, 400i) — body font for summary paragraphs. Readable serif that contrasts well against the sans-serif headlines.

### PandaCSS Theme (`panda.config.ts`)

Dark theme inspired by Summly: near-black background, card surfaces, monochrome text, with one accent colour per category used on card left borders, labels, and interactive states.

```ts
tokens: {
  colors: {
    // Base surfaces
    bg:          { value: '#0f0f0f' },
    surface:     { value: '#1a1a1a' },
    surfaceHigh: { value: '#242424' },
    border:      { value: '#2e2e2e' },

    // Text
    textPrimary: { value: '#f0f0f0' },
    textMuted:   { value: '#888888' },

    // Category accents
    world:    { value: '#e85a3c' },   // warm red-orange  — World / Politics
    tech:     { value: '#4a9eff' },   // electric blue    — Technology
    science:  { value: '#3ecf8e' },   // teal green       — Science
    business: { value: '#f5c542' },   // amber            — Business / Economy
  },
  fonts: {
    display: { value: 'Syne, sans-serif' },
    body:    { value: 'Instrument Serif, Georgia, serif' },
  },
}
```

Each `StoryCard` renders its category accent as a 3px left border. Category label and expand indicator use the same accent. Everything else is monochrome.

Use PandaCSS recipes for `StoryCard` collapsed/expanded variants. No inline styles.

### Fontaine

Add the Vite plugin pointed at Syne and Instrument Serif. Eliminates CLS on font load.

### Clerk

Wrap in `<ClerkProvider>`. No sign-in UI needed — `edition.build` is called manually with a Clerk session token. Auth is not required for reading.

### Environment Variables

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_URL=               # Cloudflare Worker base URL
```

---

## Testing

### Stack

| Package | Purpose |
|---|---|
| `vitest` | Test runner for both `apps/api` and `apps/web` |
| `happy-dom` | DOM environment for React component tests |
| `@testing-library/react` | Component behaviour testing |
| `@testing-library/user-event` | Simulating real user interactions |

Vitest config is defined per app. `apps/api` runs in the default Node environment. `apps/web` sets `environment: 'happy-dom'`.

### apps/api

**Pipeline unit tests (`src/pipeline.test.ts`)**

Test each pipeline step in isolation using `vi.mock` to stub `ofetch` and the Anthropic SDK — no real network calls in tests.

- `fetchFeed` — mock `ofetch` to return raw XML strings; assert correct `RssItem[]` shape is parsed
- `deduplicateByTitle` — test exact match, substring match, and non-duplicate cases
- `selectStories` — assert correct count per category, correct sort by `pubDate`, correct trim to `TARGET_STORY_COUNT`
- `buildEdition` — mock all dependencies; assert idempotency check returns early when today's edition exists; assert transaction is called with correctly shaped data on a fresh build

**tRPC procedure tests (`src/router.test.ts`)**

Use `@trpc/server`'s `createCallerFactory` to call procedures directly without an HTTP layer.

- `edition.today` — mock `db` to return a seeded edition; assert correct `Story[]` is returned; assert `null` is returned when no edition exists for today
- `edition.build` — assert unauthenticated calls are rejected; assert authenticated calls invoke `buildEdition`; assert idempotency is respected

### apps/web

**Component behaviour tests**

- `StoryCard` — renders collapsed by default; expands on click; shows summary text when expanded; shows share button when expanded; collapses when clicked again
- `CategoryNav` — renders all category tabs; clicking a tab updates the active filter; "All" tab shows all stories
- `App (index route)` — shows loading state while query is in-flight; shows `not_ready` state when `data` is `null`; renders correct number of cards when data is present; shows error state on query failure

Mock the tRPC client with `vi.mock` — no real API calls in component tests.

### Turbo Pipeline

Add `test` to `turbo.json`:

```json
"test": { "dependsOn": ["^build"], "cache": true }
```

Run all tests from the root:

```bash
turbo test
```

---

## Deployment

### apps/api → Cloudflare Workers

```bash
wrangler deploy
```

Secrets set once:

```bash
wrangler secret put DATABASE_URL
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_ADMIN_USER_ID
wrangler secret put WEB_ORIGIN
```

The Cron Trigger (`0 4 * * *`) is defined in `wrangler.toml` and activated on deploy. Monitor runs in the Cloudflare dashboard under Workers → Triggers → Cron.

### apps/web → Cloudflare Pages

- Build command: `turbo build --filter=web`
- Output directory: `apps/web/dist`
- Set `VITE_*` env vars in the Pages dashboard
- Add `apps/web/public/_redirects`:

```
/* /index.html 200
```

### Local Dev

```bash
# Terminal 1 — Vite on :5173
turbo dev --filter=web

# Terminal 2 — Wrangler dev on :8787
turbo dev --filter=api
```

Set `VITE_API_URL=http://localhost:8787` in `.env`.

---

## Build Order

1. `packages/tsconfig` — no dependencies
2. `packages/db` — schema, run first migration against Neon
3. `packages/api` — lock shared tRPC types before implementing either app
4. `apps/api` — implement and test pipeline in isolation via `wrangler dev`, then wire tRPC procedures
5. `apps/web` — build UI against live Worker last

---

## Package Manifest

A complete list of all packages per workspace.

### Root

```json
{
  "devDependencies": {
    "turbo": "latest",
    "@biomejs/biome": "latest",
    "typescript": "latest"
  }
}
```

### packages/tsconfig

No dependencies — config files only.

### packages/db

```json
{
  "dependencies": {
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest"
  }
}
```

### packages/api

```json
{
  "dependencies": {
    "@trpc/server": "latest"
  }
}
```

### apps/api

```json
{
  "dependencies": {
    "hono": "latest",
    "@hono/trpc-server": "latest",
    "@trpc/server": "latest",
    "@anthropic-ai/sdk": "latest",
    "@clerk/backend": "latest",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "ofetch": "latest"
  },
  "devDependencies": {
    "wrangler": "latest",
    "vitest": "latest",
    "@cloudflare/workers-types": "latest"
  }
}
```

### apps/web

```json
{
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "@trpc/client": "latest",
    "@trpc/react-query": "latest",
    "@tanstack/react-query": "latest",
    "@tanstack/react-router": "latest",
    "@clerk/react": "latest",
    "@ark-ui/react": "latest",
    "@park-ui/panda-preset": "latest",
    "ofetch": "latest"
  },
  "devDependencies": {
    "vite": "latest",
    "@vitejs/plugin-react": "latest",
    "vite-plugin-fontaine": "latest",
    "@pandacss/dev": "latest",
    "vitest": "latest",
    "happy-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@tanstack/router-plugin": "latest"
  }
}
```

> Use exact versions in production. `latest` is used here for brevity — pin everything before committing `package-lock.json`.

---

## Out of Scope (v1)

- User accounts or personalisation
- Archive / past editions UI
- Push notifications
- Mobile app
- Search