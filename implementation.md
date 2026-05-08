# pitchd. — Implementation Ideas

> Living doc. Update this whenever an idea is discussed or completed. Mark done items ✅.

---

## 🐛 Bugs to Fix

### Double score POST (Priority: High)
**Where:** `GameClient.tsx → handleRevealComplete()` (line ~314)  
**Problem:** When a 5-round pitch game ends, `handleRevealComplete` fires a POST to `/api/scores` automatically with `initials: 'NAN'`. Then `postScore` fires a second POST when the user clicks Submit. Two `game_sessions` rows logged per game.  
**Fix:** Remove the fire-and-forget `fetch('/api/scores', ...)` inside `handleRevealComplete`. Let `postScore` be the only submission path.

---

## 🎨 UX / Polish

### Replace `alert()` with toast notifications (Priority: High)
**Where:** `GameClient.tsx` — 3 instances:
- Line ~373: submission error
- Line ~406: "Score Posted & Copied to clipboard!"
- Line ~845: "Copied!" (BPM share button)

**Approach:** Create a small `useToast` hook + `<Toast>` component (fixed bottom-centre, auto-dismiss after 2.5s, slide-up animation). No external library needed — ~40 lines.

---

### Show BPM best score on final screen (Priority: Medium)
**Where:** `GameClient.tsx` BPM final phase, `hooks/useBpmGame.ts`  
**Problem:** `bpm_best` is written to localStorage but never read/displayed.  
**Fix:** Read `bpm_best` in the BPM final view and show "Personal best: XX.XX / 20.00" under the score. Also show "New best! 🎉" if this game beat it. Export `bestScore` from `useBpmGame`.

---

### Replay tempo button in BPM guessing phase (Priority: Medium)
**Where:** `GameClient.tsx` BPM guessing phase, `hooks/useBpmGame.ts`  
**Approach:** Add a one-use `hasReplayed` state flag. Show a "Replay (1×)" button during guessing that re-plays the target BPM metronome for 2 seconds, then stops. Disable after use. This removes frustration on hard BPMs without eliminating the challenge.

---

## 🆕 Features

### Real BPM article pages (Priority: High — SEO gap)
**Where:** `app/bpm/articles/[slug]/page.tsx` (new file), `components/GameClient.tsx`  
**Problem:** `BPM_ARTICLES_DATA` in GameClient renders as plain `<div>` elements — no links, no pages. The pitch side has 6 full articles at `/articles/[slug]`. BPM articles are stubs.  
**3 articles to write:**
1. "How to Train Your Tempo Ear" (`how-to-train-your-tempo-ear`)
2. "The Science of Groove: Why Tempo Perception Varies" (`science-of-groove`)
3. "Metronome Practice: Building a Reliable Internal Clock" (`metronome-practice-internal-clock`)

**Approach:** Mirror the pitch article architecture — `ARTICLES` record in `app/bpm/articles/[slug]/page.tsx`, `generateStaticParams`, `generateMetadata`, `Article` + `BreadcrumbList` JSON-LD, same card UI. Convert `BPM_ARTICLES_DATA` items in GameClient from `<div>` to `<Link href="/bpm/articles/[slug]">`.

---

### BPM stats view (Priority: Medium)
**Where:** `GameClient.tsx`, `hooks/useBpmGame.ts`  
**Goal:** Parity with the pitch stats view (games played, best score, score history bar chart).  
**Approach:** Track `bpm_gamesPlayed` and `bpm_scoreHistory` in localStorage. Add a Stats button to the BPM idle screen that opens a stats view inside the card (same card-view-enter animation). Reuse the bar chart pattern from the pitch stats view.

---

### Daily BPM challenge (Priority: Medium)
**Where:** `hooks/useBpmGame.ts`, `GameClient.tsx`  
**Goal:** Same "come back tomorrow" hook as the pitch daily mode. All players get the same 5 BPM sequence each day.  
**Approach:** Use the same `getDailyDateString()` + Mulberry32 PRNG from `lib/seed.ts`. Seed `"YYYY-MM-DD-bpm-RN"` → deterministic BPM selection from `ALL_BPMS`. Add a Daily/Practice toggle to the BPM idle screen. Track daily BPM streak separately in localStorage.

---

### Tap tempo input (Priority: Low)
**Where:** `GameClient.tsx` BPM guessing phase  
**Goal:** Alternative to slider — tap a button repeatedly to the beat, app measures inter-tap interval and sets BPM = 60000 / avg_ms. Some users will find tapping more natural.  
**Approach:** Show two tabs in the guessing phase: "Slider" (current) and "Tap". Tap button averages last N taps (ignore first to let user settle). Auto-reset after 2s of inactivity.

---

### Keyboard shortcuts shown in UI (Priority: Low)
**Where:** `components/Piano.tsx` already has `KEY_MAP` wired up  
**Problem:** Keyboard shortcuts exist and work but are never shown to the user.  
**Fix:** Add a small "keyboard" hint (maybe a `?` icon near the piano) that toggles a tooltip showing the key mapping. Only show on non-touch devices.

---

## 🧹 Cleanup

### Delete orphaned files (Safe to do anytime)
- `components/AppShell.tsx` — was for an abandoned tab architecture, not imported anywhere
- `components/BpmGame.tsx` — BPM game moved into GameClient, not imported anywhere

---

## ✅ Completed

- ✅ BPM Guesser game mode (listen → slider → score, 5 rounds)
- ✅ Live metronome during guessing phase (slider updates BPM in real time)
- ✅ Beat-synced visual pulse (ring + dot animations, `key={pulseKey}` remount trick)
- ✅ Top mode-switcher navbar (Pitch / BPM pill)
- ✅ Context-aware Articles/Scoring navbar links (routes to `/bpm/articles` or `/articles` depending on mode)
- ✅ BPM routes: `/bpm`, `/bpm/articles`, `/bpm/scoring` as proper Next.js pages
- ✅ Percentage-based BPM scoring (5 tiers, percentage of target BPM)
- ✅ Continuous decimal BPM scoring (linear interpolation within each tier, 4.00→3.00 etc.)
- ✅ `pct` exposed on `RoundResult` — result screen shows "X.X% off"
- ✅ SEO: `WebSite` + `Organization` JSON-LD in layout, `WebApplication` + `FAQPage` on `/bpm`
- ✅ SEO: `BreadcrumbList` + `dateModified` on article pages
- ✅ SEO: `ItemList` JSON-LD on articles listing
- ✅ SEO: BPM routes added to sitemap with correct priorities
- ✅ SEO: Keywords expanded to cover BPM/rhythm terms sitewide
- ✅ SEO: Improved titles, descriptions, OG/Twitter tags across all pages
