# pitchd. — App Reference

> Read this at the start of every session to get full context without re-reading the codebase.

---

## What is pitchd.?

**pitchd.** (`pitchd.net`) is a free daily ear-training and rhythm web app with two game modes:

- **Pitch game** — Listen to a 4-note sequence, recreate it on an on-screen piano. 5 rounds, scored out of 50 pts. Daily + Endless modes. Global leaderboard.
- **BPM Guesser** (`/bpm`) — A metronome plays at a mystery tempo for ~4 seconds. Use a slider or tap-tempo to match the BPM. 5 rounds, scored out of 20.00 pts (continuous decimal scoring). Daily + Practice modes. Worldwide play count via Supabase.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js App Router (v16.2.1) |
| Dev server | Turbopack |
| Styling | Tailwind CSS v4 (`@theme` CSS variables) |
| Fonts | Zodiak (display/headings), Satoshi (body) — local woff2 |
| Pitch audio | Tone.js (`PolySynth`, `Reverb`, `FeedbackDelay`) |
| BPM audio | Web Audio API (`AudioContext`, `OscillatorNode`) — raw, no library |
| Animations | GSAP (piano key bounce), CSS keyframes (card crossfade, BPM pulse) |
| Database | Supabase (Postgres) — leaderboard, game_sessions, bpm_sessions |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

---

## Key File Map

```
app/
  globals.css              # Tailwind v4 @theme, custom keyframes, fonts
  layout.tsx               # Root metadata, WebSite + Organization JSON-LD
  page.tsx                 # Home — VideoGame + FAQPage JSON-LD
  sitemap.ts               # All routes for search crawlers
  robots.ts / manifest.ts

  /bpm/
    page.tsx               # BPM route — WebApplication + FAQPage JSON-LD
    /articles/page.tsx     # BPM article listing
    /articles/[slug]/page.tsx  # Full BPM article pages (3 articles)
    /scoring/page.tsx      # BPM scoring guide

  /scoring/page.tsx        # Pitch scoring route (renders GameClient)
  /articles/page.tsx       # Pitch article listing (renders GameClient + ItemList JSON-LD)
  /articles/[slug]/page.tsx # Full pitch article pages (6 articles)
  /share/page.tsx          # Share result OG page

  /api/
    scores/route.ts        # POST: log pitch game + upsert leaderboard + return percentile
    leaderboard/route.ts   # GET: top 10 scores for today
    stats/global/route.ts  # GET: pitch games played + notes pitched (cached 60s)
    stats/bpm-global/route.ts  # GET: bpm games played worldwide (cached 60s, baseline +500)
    bpm-sessions/route.ts  # POST: record completed BPM game
    daily/route.ts         # Daily seed endpoint

components/
  GameClient.tsx           # Main interactive shell — ALL game UI (pitch + BPM)
  Piano.tsx                # Piano keyboard — mouse/touch + keyboard (KEY_MAP)
  ScoreReveal.tsx          # Animated per-note scoring reveal (pitch)
  ParticleField.tsx        # Background particle animation
  Toast.tsx                # Module-singleton toast notification system
  BackButton.tsx           # Smart back button for article pages

hooks/
  useBpmGame.ts            # All BPM state, audio scheduling, scoring, daily mode

lib/
  audio.ts                 # Tone.js AudioEngine singleton (pitch game)
  seed.ts                  # Mulberry32 PRNG, getDailySequenceForRound, getDailyBpmSequence, scoreNote
  pitch-articles.ts        # All 6 pitch article content (shared with standalone pages + in-card view)
  bpm-articles.ts          # All 3 BPM article content (shared with standalone pages + in-card view)
```

---

## Architecture: How Everything Connects

### Single-Page Shell
`GameClient.tsx` is the entire interactive app — a single `"use client"` component managing:
- `gameState`: `'home' | 'listen' | 'play' | 'reveal' | 'results'` — pitch game phase
- `homeView`: `'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article'` — card content when gameState === 'home'

The `/bpm`, `/bpm/articles`, `/bpm/scoring`, `/articles`, `/scoring` routes all render `<GameClient />`. A lazy `useState` initializer reads `window.location.pathname` to set the correct `homeView` without an SSR flash.

### Card Morphing
The centre card uses `transition-[max-width,height]` with a measured `cardHeight` from `cardInnerRef.scrollHeight`. Each view uses `.card-view-enter` CSS animation. `switchView()` fades out (250ms), swaps state, fades in.

### URL Sync
`switchView()` calls `history.pushState()` — no navigation. A `popstate` listener syncs on back/forward. `VIEW_URL` maps view names to URL paths. Views without a URL entry (`article`, `bpm-article`) skip the pushState.

### Articles In Card
Clicking an article in the list view calls `openArticle(slug, type)` which sets `activeArticleSlug` + fades to `'article'` or `'bpm-article'` homeView. Full article content renders inside the card with `max-h-[52vh] overflow-y-auto`. Standalone article pages still exist for SEO/direct URL access.

### BPM Audio
`useBpmGame.ts` uses Web Audio API lookahead scheduler:
- `setInterval` at 25ms fires the scheduler
- Scheduler fills 150ms lookahead buffer of `OscillatorNode` clicks at exact `AudioContext.currentTime` offsets
- Visual pulses use `setTimeout` at the same offsets (beat-synced)
- `key={pulseKey}` trick: incrementing remounts animated elements, restarting CSS animations

---

## Pitch Game Scoring (`lib/seed.ts → scoreNote()`)

| Result | Points |
|---|---|
| Perfect match (same note+octave) | 2.50 |
| Perfect octave (same note, wrong octave) | 2.00 |
| Perfect 5th (7 semitones) | 1.50 |
| Perfect 4th (5 semitones) | 1.25 |
| Adjacent (1 semitone off) | 1.00 |
| Other | `2.5 * 0.5^dist` (exponential decay, min 0) |

- 4 notes × 2.50 = **10 pts/round**, 5 rounds = **50 pts max**
- Notes pool: C4–E5 (17 notes)
- Daily: Mulberry32 PRNG seeded `"YYYY-MM-DD-RN"` — deterministic for all players

### Piano Keyboard Shortcuts
```
a=C4  w=Db4  s=D4  e=Eb4  d=E4  f=F4  t=Gb4
g=G4  y=Ab4  h=A4  u=Bb4  j=B4  k=C5  o=Db5
l=D5  p=Eb5  ;=E5
```

---

## BPM Game Scoring (`hooks/useBpmGame.ts → scoreGuess()`)

Continuous decimal scoring — interpolates linearly within each tier:

| Tier | % off target | Points range | At 100 BPM |
|---|---|---|---|
| Perfect | ≤ 3% | 4.00 → 3.00 | ±3 BPM |
| Great | ≤ 8% | 3.00 → 2.00 | ±8 BPM |
| Good | ≤ 15% | 2.00 → 1.00 | ±15 BPM |
| Close | ≤ 25% | 1.00 → 0.00 | ±25 BPM |
| Miss | > 25% | 0.00 | — |

- Every tier boundary is a clean integer
- 5 rounds = **20.00 pts max**

### BPM Pools
- Easy: 60, 70, 80, 90, 100, 110, 120
- Medium: 72, 85, 96, 108, 116, 128
- Hard: 67, 78, 93, 107, 113, 137, 152
- Daily: deterministic via `getDailyBpmSequence()` (Mulberry32 seeded `"YYYY-MM-DD-bpm-RN"`)

---

## Supabase Schema

**`scores`** — pitch leaderboard: `device_id`, `date_str`, `score`, `player_sequence`, `initials`. Unique on `(device_id, date_str)`.

**`game_sessions`** — pitch analytics: `device_id`, `score`. Every completed pitch game.

**`bpm_sessions`** — BPM analytics: `device_id`, `total_score`. Every completed BPM game. Auto-posted when `bpmPhase` hits `'final'`.

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## LocalStorage Keys

| Key | Purpose |
|---|---|
| `pitchd_device_id` | Anonymous device fingerprint |
| `pitchd_initials` | Last used initials |
| `pitchd_streak` | Pitch daily streak count |
| `pitchd_last_played` | Last pitch daily play date |
| `pitchd_stats` | `{ gamesPlayed, maxStreak, scoreHistory[] }` |
| `bpm_best` | All-time best BPM score (float) |
| `bpm_games_played` | Total BPM games ever completed |
| `bpm_score_history` | JSON array of past BPM scores |
| `bpm_daily_streak` | BPM daily streak count |
| `bpm_last_daily_date` | Last BPM daily play date |

---

## Styling Conventions

- **Tailwind v4** with `@theme` CSS variables in `globals.css`
- Theme classes: `bg-bg`, `bg-surface`, `bg-surface-2`, `text-text-muted`, `text-text-faint`, `border-border`
- `font-display` → Zodiak; default → Satoshi
- Custom keyframes: `card-crossfade`, `stats-slide-in`, `shake`, `bpm-ring`, `beat-dot`
- Pitch accent: purple (`purple-400`, `purple-500/20`)
- BPM accent: orange (`orange-400`, `orange-500/20`)

---

## SEO Setup

- `metadataBase: https://pitchd.net` in layout.tsx
- JSON-LD: `WebSite`+`Organization` (layout), `VideoGame`+`FAQPage` (home), `WebApplication`+`FAQPage` (BPM), `Article`+`BreadcrumbList` (articles), `ItemList` (listings), `FAQPage` (scoring)
- Sitemap: all routes including BPM articles
