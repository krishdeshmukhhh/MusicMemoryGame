# pitchd. — App Reference

> Read this at the start of every session to get full context without re-reading the codebase.

---

## What is pitchd.?

**pitchd.** (`pitchd.net`) is a free daily ear-training and rhythm web app with two game modes:

- **Pitch game** — Listen to a 4-note sequence, recreate it on an on-screen piano. 5 rounds. Scored out of 50 pts. Daily leaderboard.
- **BPM Guesser** (`/bpm`) — A metronome plays at a mystery tempo for ~4 seconds. Use a slider to match the BPM you heard. 5 rounds. Scored out of 20.00 pts (continuous decimal scoring).

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
| Database | Supabase (Postgres) — leaderboard, game sessions |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

---

## Key File Map

```
app/
  globals.css              # Tailwind v4 @theme, custom keyframes, fonts
  layout.tsx               # Root metadata (title template, OG, Twitter, robots), WebSite + Organization JSON-LD
  page.tsx                 # Home — VideoGame + FAQPage JSON-LD, sr-only semantic HTML
  sitemap.ts               # All routes for search crawlers
  robots.ts                # robots.txt
  manifest.ts              # PWA manifest

  /bpm/
    page.tsx               # BPM route — WebApplication + FAQPage JSON-LD, sr-only HTML
    /articles/page.tsx     # BPM articles listing route
    /scoring/page.tsx      # BPM scoring guide route

  /scoring/page.tsx        # Pitch scoring full page (standalone route with real content)
  /articles/page.tsx       # Pitch article listing with ItemList JSON-LD
  /articles/[slug]/page.tsx # Full article pages — Article + BreadcrumbList JSON-LD (6 articles)
  /share/page.tsx          # Share result page (OG image)

  /api/
    scores/route.ts        # POST: log game session + upsert leaderboard high score + return percentile
    leaderboard/route.ts   # GET: top 10 scores for today
    stats/global/route.ts  # GET: total games played + notes pitched (cached 60s)
    daily/route.ts         # (exists, purpose: daily seed endpoint)

components/
  GameClient.tsx           # Main interactive shell — ALL game UI lives here (pitch + BPM)
  Piano.tsx                # Piano keyboard — mouse/touch + keyboard input (KEY_MAP defined here)
  ScoreReveal.tsx          # Animated per-note scoring reveal after each pitch round
  ParticleField.tsx        # Background particle animation (reacts to game state)
  AppShell.tsx             # ORPHANED — was for a tab architecture, unused
  BpmGame.tsx              # ORPHANED — BPM game was moved into GameClient, unused

hooks/
  useBpmGame.ts            # All BPM game state, audio scheduling, scoring

lib/
  audio.ts                 # Tone.js AudioEngine singleton (pitch game)
  seed.ts                  # Daily sequence generation (Mulberry32 PRNG), scoreNote(), NOTES array
```

---

## Architecture: How Everything Connects

### Single-Page Shell
`GameClient.tsx` is the entire interactive app. It's a single `"use client"` component that manages:
- `gameState`: `'home' | 'listen' | 'play' | 'reveal' | 'results'` — pitch game phase
- `homeView`: `'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring'` — what the card shows when `gameState === 'home'`

The `/bpm`, `/bpm/articles`, `/bpm/scoring` routes all render `<GameClient />`. A lazy `useState` initializer reads `window.location.pathname` on first render to set the correct `homeView` without an SSR flash.

### Card Morphing
The centre card uses `transition-[max-width,height]` with a measured `cardHeight` (set via `ResizeObserver`-like `useEffect` on `cardInnerRef`). Each view inside uses `.card-view-enter` (`@keyframes card-crossfade` in globals.css) for the crossfade animation. `switchView()` fades out, swaps state, fades in.

### URL Sync
`switchView()` calls `history.pushState()` to update the URL without navigation. A `popstate` listener syncs `homeView` on browser back/forward. The `VIEW_URL` map in GameClient defines the URL for each view.

### BPM Audio
`useBpmGame.ts` uses a raw Web Audio API lookahead scheduler — NOT Tone.js:
- `setInterval` at 25ms fires the scheduler
- Scheduler fills a 150ms lookahead buffer of `OscillatorNode` clicks at exact `AudioContext.currentTime` offsets
- Visual pulses use `setTimeout` scheduled at the same offsets (so they're beat-synced, not just interval-based)
- `key={pulseKey}` trick: incrementing `pulseKey` remounts the animated elements, restarting CSS animations

### Pitch Audio
`lib/audio.ts` exports a singleton `engine`. `engine.init()` must be called on first user gesture (iOS requires this). Includes a silent warmup chord to pre-compile Web Audio nodes so the first sequence plays in sync.

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

- 4 notes per round × max 2.50 pts = **10 pts/round**
- 5 rounds = **50 pts max**
- Notes pool: C4 through E5 (17 notes, `lib/seed.ts → NOTES`)
- Daily sequence: Mulberry32 PRNG seeded with `"YYYY-MM-DD-RN"` string — deterministic, same for all players

### Piano Keyboard Shortcuts (Piano.tsx)
```
a=C4  w=Db4  s=D4  e=Eb4  d=E4  f=F4  t=Gb4
g=G4  y=Ab4  h=A4  u=Bb4  j=B4  k=C5  o=Db5
l=D5  p=Eb5  ;=E5
```

---

## BPM Game Scoring (`hooks/useBpmGame.ts → scoreGuess()`)

Continuous decimal scoring — interpolates linearly within each tier:

| Tier | % off | Points range |
|---|---|---|
| Perfect | ≤ 1.5% | 4.00 → 3.00 |
| Great | ≤ 4% | 3.00 → 2.00 |
| Good | ≤ 8% | 2.00 → 1.00 |
| Close | ≤ 15% | 1.00 → 0.00 |
| Miss | > 15% | 0.00 |

- Formula within Perfect: `4 - pct/1.5`
- Formula within Great: `3 - (pct-1.5)/2.5`  
- Formula within Good: `2 - (pct-4)/4`
- Formula within Close: `1 - (pct-8)/7`
- Every tier boundary is a clean integer
- 5 rounds = **20.00 pts max**
- Best score saved to `localStorage('bpm_best')` — **not yet displayed in UI**

### BPM pools
- Easy: 60, 70, 80, 90, 100, 110, 120
- Medium: 72, 85, 96, 108, 116, 128
- Hard: 67, 78, 93, 107, 113, 137, 152
- All pools combined for random selection — no daily sequence yet

---

## Supabase Schema (inferred from API routes)

**`scores` table** — leaderboard
- `device_id`, `date_str`, `score`, `player_sequence`, `initials`
- Unique constraint on `(device_id, date_str)` — one leaderboard entry per device per day

**`game_sessions` table** — raw analytics
- `device_id`, `score`
- Every completed game logged here regardless of leaderboard

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Styling Conventions

- **Tailwind v4** with `@theme` CSS variables in `globals.css`
- Use canonical theme classes: `bg-bg`, `bg-surface`, `bg-surface-2`, `text-text-muted`, `text-text-faint`, `border-border`
- Hardcoded `bg-[#050505]` on `GameClient.tsx` main element — this is the game area background (intentionally near-black, separate from `--color-bg`)
- `font-display` → Zodiak; default body → Satoshi
- Custom keyframes in globals.css: `card-crossfade`, `stats-slide-in`, `shake`, `bpm-ring`, `beat-dot`

---

## LocalStorage Keys

| Key | Purpose |
|---|---|
| `pitchd_device_id` | Anonymous device fingerprint |
| `pitchd_initials` | Last used initials (pre-fills input) |
| `pitchd_streak` | Current daily streak count |
| `pitchd_last_played` | ISO date of last daily game (for streak calc) |
| `pitchd_stats` | `{ gamesPlayed, maxStreak, scoreHistory[] }` |
| `bpm_best` | All-time best BPM game score (float) |

---

## SEO Setup (as of session May 2026)

- `metadataBase: https://pitchd.net` in layout.tsx — resolves relative canonicals
- JSON-LD schemas in place: `WebSite` + `Organization` (layout), `VideoGame` + `FAQPage` (home), `WebApplication` + `FAQPage` (BPM), `Article` + `BreadcrumbList` (articles), `ItemList` (article listing), `FAQPage` (scoring)
- Sitemap includes: `/`, `/articles`, all 6 article slugs, `/scoring`, `/bpm`, `/bpm/articles`, `/bpm/scoring`
- Keywords cover both pitch and BPM/rhythm terms

---

## Known Issues / Quirks

1. **BPM best score not shown:** Saved to `localStorage('bpm_best')` but never read in UI. The `useBpmGame` hook saves it on game end but the final screen doesn't display it.

2. **`AppShell.tsx` and `BpmGame.tsx` are orphaned** — these files exist but are no longer imported anywhere. Safe to delete.
