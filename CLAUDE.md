# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint (must stay at 0 problems)
npm test         # Vitest unit tests (tests/*.test.ts)
```

Tests cover the pure logic in `lib/` (scoring, daily determinism, dates/streaks, share encoding, server-side validation, article data). Keep game rules in `lib/` so they stay testable; components and hooks import from there.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Supabase is optional for local development — API routes degrade gracefully when env vars are absent.

## Architecture

### Single interactive shell
Every game route (`/`, `/bpm`, `/bpm/articles`, `/bpm/scoring`, `/articles`, `/scoring`) renders `<GameShell />`, a server component that builds the article listings and renders `<GameClient />`. There is no page-level navigation — only one React tree is ever mounted. A lazy `useState` initializer uses `usePathname()` (via `parsePath`) to set the initial `homeView` so SSR and client agree.

`homeView` drives which card content is visible. Switching views calls `switchView(target)`, which fades out (250ms), swaps `homeView`, fades in, and calls `history.pushState()` to sync the URL — **never use `router.push()`** for in-app navigation. A `popstate` listener handles browser back/forward.

Valid `homeView` values: `'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article'`. The `VIEW_URL` map in `GameClient.tsx` controls which URL each view pushes to history. Opening an article in-card pushes its real URL (`/articles/<slug>` or `/bpm/articles/<slug>`); a refresh there loads the standalone server-rendered article page. In-card links are real `<a href>` elements whose plain left-click is intercepted (`isPlainClick`), so crawlers and cmd-click still see real links.

### Card height animation
The centre card animates its height via `transition-[max-width,height]` with a `cardHeight` value read from `cardInnerRef.scrollHeight`. A `ResizeObserver` re-measures on every content change (view switch, BPM phase change, etc.) plus a 350ms delayed measurement to catch late-loading fonts and images.

### Bundle splitting
The initial JS must stay small (~228 KB gzipped, down from 465 KB). Keep these off the critical path:
- **three.js**: `ParticleField` is loaded with `next/dynamic({ ssr: false })`.
- **Tone.js**: `lib/audio.ts` imports it lazily; `engine.preload()` runs on idle, `engine.init()` (user gesture) starts audio.
- **Article bodies**: never import `lib/pitch-articles.ts` / `lib/bpm-articles.ts` from client code. Use `toArticleIndex()` on the server and `loadArticle()` (dynamic import) on the client.

### BPM game isolation
All BPM state and audio lives in `hooks/useBpmGame.ts`; the rules (pools, `scoreGuess`, `bpmFromTaps`) live in `lib/bpm.ts`. `GameClient.tsx` passes the whole hook object to `<BpmGame game={...} />`. The hook uses the Web Audio API directly (no Tone.js): a 25ms `setInterval` scheduler fills a 150ms lookahead buffer of `OscillatorNode` clicks; visual pulses are driven by `setTimeout` at the same offsets and remount animated elements via a `key={pulseKey}` increment trick.

BPM pools used for daily and practice sequencing (in `lib/bpm.ts`):
- Easy: `[60, 70, 80, 90, 100, 110, 120]`
- Medium: `[72, 85, 96, 108, 116, 128]`
- Hard: `[67, 78, 93, 107, 113, 137, 152]`

The slider range is always 40–200. Replay is allowed once per round (2-second window) via `replayTempo()`, which blocks a second call via the `hasReplayed` flag.

Tab-switch handling: if the tab goes hidden mid-listen, the countdown and metronome stop and the phase jumps to `'guessing'`. Audio resumes on return if the slider preview was playing.

### Pitch game audio
`lib/audio.ts` exports a singleton `engine` (Tone.js `PolySynth` → `FeedbackDelay` → `Reverb`). It must be initialised by a user gesture (`engine.init()`). A silent warmup chord is triggered on init to pre-JIT Web Audio nodes and prevent timing drift on the first real sequence.

The pitch game note range is **C4 to E5 (17 notes)**, defined in `lib/seed.ts` as the `NOTES` array. Scoring and sequence generation both index into this array — the array bounds matter for `scoreNote()`.

Piano keyboard shortcuts (shown on hover of the music icon in play state): `a w s e d f t g y h u j k o l p ;` → `C Db D Eb E F Gb G Ab A Bb B C Db D Eb E`.

### Daily determinism
Both games generate daily sequences with the Mulberry32 PRNG from `lib/seed.ts`. Date strings are the player's **local** calendar date (`getDailyDateString()` in `lib/daily.ts`) everywhere: puzzle, streaks, leaderboard. The pitch game locks the date at game start (`playDate`) so a game crossing midnight stays on one puzzle. Seeds are strings hashed via `stringToSeed()`:
- Pitch: `"YYYY-MM-DD-R{round}"` → 4-note sequence per round
- BPM: `"YYYY-MM-DD-bpm-R{round}"` → 5-round BPM sequence

This means **the same date string always produces the same sequence for all players**. `tests/seed.test.ts` pins known outputs; if it fails, every player's puzzle and the server-side score verification changed. The daily puzzle number (`pitchd #188`) is `getPuzzleNumber()`, counted from `PUZZLE_EPOCH` (2026-03-29).

Each game is playable once per day in Daily mode; afterwards the menu shows today's score, a share button and a countdown to the next puzzle. Today's result is stored in `pitchd_daily_result` / `bpm_daily_result`.

### Scoring
- **Pitch** — `scoreNote()` in `lib/seed.ts`: perfect = 2.5 pts, then special cases for octave (2.0), perfect 5th (1.5), perfect 4th (1.25), semitone off (1.0), otherwise `2.5 × 0.5^dist`. `scoreRound()` (rounded to 2dp) and `totalScore()` are shared by the client and the server. 4 notes × 5 rounds = 50 pts max.
- **BPM** — `scoreGuess()` in `lib/bpm.ts`: linear interpolation within percentage-off tiers (≤3% Perfect → ≤25% Close). 5 rounds = 20.00 pts max.

### Article data architecture
Adding a new article means adding **one** `ArticleData` object (title, description of at most 200 chars, date, 5–8 sections, cta) keyed by slug to `lib/pitch-articles.ts` or `lib/bpm-articles.ts`. Everything else is derived from it: in-card listing, home-page links, standalone page (`components/ArticlePage.tsx`), sitemap, ItemList JSON-LD, OG image (`/api/og?title=…`). `tests/articles.test.ts` validates the data.

### localStorage key scheme
Pitch game uses the `pitchd_*` namespace; BPM game uses `bpm_*`:

| Key | Type | Purpose |
|-----|------|---------|
| `pitchd_device_id` | string | Anonymous device identifier |
| `pitchd_initials` | string | Leaderboard initials |
| `pitchd_streak` | number | Current daily streak |
| `pitchd_last_played` | `YYYY-MM-DD` | Date of last daily pitch game |
| `pitchd_stats` | JSON | `{gamesPlayed, maxStreak, scoreHistory[]}` (last 100) |
| `pitchd_daily_result` | JSON | `{date, total, grid, percentile?}`: today's daily, for the gate + re-share |
| `bpm_games_played` | number | Total BPM games played |
| `bpm_best` | number | Best BPM session score |
| `bpm_score_history` | JSON | Array of past scores |
| `bpm_daily_streak` | number | Current BPM daily streak |
| `bpm_last_daily_date` | `YYYY-MM-DD` | Date of last daily BPM game |
| `bpm_daily_result` | JSON | `{date, total, grid}`: today's BPM daily |

Streaks are stored as-is but displayed through `liveStreak()`, which shows 0 once the last play is older than yesterday.

### Supabase schema
Three tables (`supabase/schema.sql`; RLS on, no public policies, so only the service role touches them):
- `game_sessions`: every pitch game completion, daily and endless (`device_id`, `score`); posted to `/api/game-sessions` from `finishGame()`; used for the global play count.
- `scores`: daily leaderboard (`device_id`, `date_str`, `score`, `player_sequence`, `initials`). Only **daily** games can be submitted. The client sends the 5×4 notes played; the server recomputes the score (`validatePitchSubmission` in `lib/validate.ts`) and only accepts dates that are "today" somewhere on Earth. The best score per device per day is kept.
- `bpm_sessions`: every BPM game completion (`device_id`, `total_score`); auto-submitted from the `bpmPhase === 'final'` effect in `GameClient.tsx`.

### API routes
All routes are under `app/api/`. They use the Supabase service role key via `getSupabase()` in `lib/supabase.ts` (returns null without env vars). All input is sanitized with `lib/validate.ts`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scores` | POST | Verifies + upserts a daily pitch score, returns `{score, percentile}` |
| `/api/game-sessions` | POST | Logs a completed pitch game |
| `/api/bpm-sessions` | POST | Logs a completed BPM session |
| `/api/leaderboard` | GET | Top 10 for `?date=YYYY-MM-DD` (the client's local date) |
| `/api/stats` | GET | Returns global play counts (60s cache, +1000 pitch / +500 BPM baseline offset) |
| `/api/og` | GET | OG images: result card (`game,score,grid,n,percentile,streak`), article card (`title,game,kicker`), or brand card |

### Sharing
`lib/share.ts` builds Wordle-style share text (`pitchd #188 — 38.50/50` + emoji grid + link) and `/share?…` URLs. The grid is a compact code string (pitch: one of `g/b/y/r` per note, rows joined by `-`; BPM: one of `g/y/o/n/r` per round). `shareResult()` uses the native share sheet on touch devices and the clipboard elsewhere. `/share` renders a real "can you beat it?" landing page (noindex); never turn it back into a redirect, or link-preview crawlers lose the result card.

### Analytics
Vercel Analytics custom events via `track()`: `game_start`, `game_complete`, `score_submit`, `share`, `article_open`.

### SEO
Page `title`s must NOT include `| pitchd.`; the root layout template appends it. Every indexable page sets `alternates.canonical`.

### Styling conventions
Tailwind v4 with `@theme` CSS variables defined in `app/globals.css`. Use semantic tokens (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-text-muted`, `text-text-faint`, `border-border`) rather than raw Tailwind colours. Pitch accent = purple; BPM accent = orange. Display font = `font-display` (Zodiak); body = Satoshi (default).
