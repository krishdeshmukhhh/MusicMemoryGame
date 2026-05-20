# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

There is no test suite.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Supabase is optional for local development — API routes degrade gracefully when env vars are absent.

## Architecture

### Single interactive shell
Every game route (`/`, `/bpm`, `/bpm/articles`, `/bpm/scoring`, `/articles`, `/scoring`) renders the same `<GameClient />` component. There is no page-level navigation — only one React tree is ever mounted. A lazy `useState` initializer reads `window.location.pathname` at boot to set the initial `homeView`.

`homeView` drives which card content is visible. Switching views calls `switchView(target)`, which fades out (250ms), swaps `homeView`, fades in, and calls `history.pushState()` to sync the URL — **never use `router.push()`** for in-app navigation. A `popstate` listener handles browser back/forward.

Valid `homeView` values: `'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article'`. The `VIEW_URL` map in `GameClient.tsx` controls which URL each view pushes to history.

### Card height animation
The centre card animates its height via `transition-[max-width,height]` with a `cardHeight` value read from `cardInnerRef.scrollHeight`. A `ResizeObserver` re-measures on every content change (view switch, BPM phase change, etc.) plus a 350ms delayed measurement to catch late-loading fonts and images.

### BPM game isolation
All BPM state and audio lives in `hooks/useBpmGame.ts`. `GameClient.tsx` only passes props down to `<BpmGame />`. The hook uses the Web Audio API directly (no Tone.js): a 25ms `setInterval` scheduler fills a 150ms lookahead buffer of `OscillatorNode` clicks; visual pulses are driven by `setTimeout` at the same offsets and remount animated elements via a `key={pulseKey}` increment trick.

BPM pools used for daily and practice sequencing (in `useBpmGame.ts`):
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
Both games generate daily sequences with the Mulberry32 PRNG from `lib/seed.ts`. Seeds are strings hashed via `stringToSeed()`:
- Pitch: `"YYYY-MM-DD-R{round}"` → 4-note sequence per round
- BPM: `"YYYY-MM-DD-bpm-R{round}"` → 5-round BPM sequence

This means **the same date string always produces the same sequence for all players**. The `/api/daily` endpoint exposes all 5 pitch sequences — it is informational and not relied on for game security.

### Scoring
- **Pitch** — `scoreNote()` in `lib/seed.ts`: perfect = 2.5 pts, then special cases for octave (2.0), perfect 5th (1.5), perfect 4th (1.25), semitone off (1.0), otherwise `2.5 × 0.5^dist`. 4 notes × 5 rounds = 50 pts max.
- **BPM** — `scoreGuess()` inside `useBpmGame.ts`: linear interpolation within percentage-off tiers (≤3% Perfect → ≤25% Close). 5 rounds = 20.00 pts max.

### Article data architecture
Adding a new article requires updating **two places**:
1. **`lib/pitch-articles.ts` or `lib/bpm-articles.ts`** — add the full `ArticleData` object (title, description, date, sections array of 6, cta) keyed by slug.
2. **`components/GameClient.tsx`** — add a metadata entry `{slug, title, description, date}` to `ARTICLES_DATA` (pitch) or `BPM_ARTICLES_DATA` (BPM). These arrays drive the article listing UI; the actual content is fetched from the lib files by slug at render time.

### localStorage key scheme
Pitch game uses the `pitchd_*` namespace; BPM game uses `bpm_*`:

| Key | Type | Purpose |
|-----|------|---------|
| `pitchd_device_id` | string | Anonymous device identifier |
| `pitchd_initials` | string | Leaderboard initials |
| `pitchd_streak` | number | Current daily streak |
| `pitchd_last_played` | `YYYY-MM-DD` | Date of last daily pitch game |
| `pitchd_stats` | JSON | `{gamesPlayed, maxStreak, scoreHistory[]}` |
| `bpm_games_played` | number | Total BPM games played |
| `bpm_best` | number | Best BPM session score |
| `bpm_score_history` | JSON | Array of past scores |
| `bpm_daily_streak` | number | Current BPM daily streak |
| `bpm_last_daily_date` | `YYYY-MM-DD` | Date of last daily BPM game |

### Supabase schema
Three tables:
- `game_sessions` — every pitch game completion (`device_id`, `score`); used for global play count.
- `scores` — daily leaderboard (`device_id`, `date_str`, `score`, `player_sequence`, `initials`), upserted on conflict so only the best score per device per day is kept.
- `bpm_sessions` — every BPM game completion (`device_id`, `total_score`); auto-submitted from the `bpmPhase === 'final'` effect in `GameClient.tsx`.

### API routes
All routes are under `app/api/`. They use the Supabase service role key (server-side only).

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/daily` | GET | Returns all 5 pitch sequences for today |
| `/api/scores` | POST | Upserts pitch score, returns percentile |
| `/api/bpm-sessions` | POST | Logs a completed BPM session |
| `/api/leaderboard` | GET | Returns top scores |
| `/api/stats` | GET | Returns global play counts (60s cache, +1000 pitch / +500 BPM baseline offset) |
| `/api/og` | GET | Generates OG image for `/share` page |

### Styling conventions
Tailwind v4 with `@theme` CSS variables defined in `app/globals.css`. Use semantic tokens (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-text-muted`, `text-text-faint`, `border-border`) rather than raw Tailwind colours. Pitch accent = purple; BPM accent = orange. Display font = `font-display` (Zodiak); body = Satoshi (default).
