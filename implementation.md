# pitchd. — Implementation Ideas

> Living doc. Update this whenever an idea is discussed or completed. Mark done items ✅.

---

## 🐛 Bugs to Fix

### ✅ Double score POST (Priority: High)
Removed the fire-and-forget `fetch('/api/scores', ...)` from `handleRevealComplete`. `postScore` is now the only submission path.

---

## 🎨 UX / Polish

### ✅ Replace `alert()` with toast notifications (Priority: High)
Created `components/Toast.tsx` — module-level `showToast()` function, fixed bottom-centre pill, auto-dismisses after 2.8s, slide-up animation. Replaced all 3 `alert()` calls in GameClient.

### ✅ BPM best score on final screen
Shows "🎉 New Personal Best!" on the BPM final screen when the player beats their all-time record. Daily streak also shown when > 1.

### ✅ BPM scoring widened — more accessible
Tiers doubled from 1.5/4/8/15% to 3/8/15/25%. At 100 BPM: Perfect ≤3 BPM, Great ≤8 BPM, Good ≤15 BPM, Close ≤25 BPM.

---

## 🆕 Features

### ✅ Real BPM article pages (Priority: High — SEO gap)
Created `app/bpm/articles/[slug]/page.tsx` with all 3 full articles (6 sections each), `generateStaticParams`, `generateMetadata`, `Article` + `BreadcrumbList` JSON-LD. Converted `BPM_ARTICLES_DATA` in GameClient from plain `<div>` to `<Link>` with hover styles. Added all 3 slugs to sitemap. Also fixed TypeScript build error (`item.range` on type `never` in BPM scoring view).

### ✅ Articles render inside card
Articles open inside the GameClient card instead of navigating away. Article data extracted to `lib/pitch-articles.ts` and `lib/bpm-articles.ts` (shared with standalone SEO pages). Standalone pages still exist for direct URL access and SEO.

### ✅ BPM worldwide stats via Supabase
`app/api/bpm-sessions/route.ts` records completed BPM games. `app/api/stats/bpm-global/route.ts` returns live count. GameClient auto-POSTs a session when bpmPhase hits 'final'. BPM idle screen shows live worldwide count with orange pulsing dot.

### ✅ BPM stats view
Full stats card (Played / Best / Daily Streak + score history bar chart). Accessible via BarChart2 icon on BPM idle screen. Bar chart uses orange hover colour, scaled to max 20.00.

### ✅ Daily BPM challenge
`getDailyBpmSequence` in `lib/seed.ts` uses Mulberry32 PRNG seeded with `"YYYY-MM-DD-bpm-RN"` to produce a deterministic 5-BPM sequence per day. Mode toggle (Practice / Daily) on idle screen. Daily mode tracks streak in localStorage (`bpm_daily_streak`, `bpm_last_daily_date`). Shows "Today's challenge complete" when already played today.

### ✅ Replay tempo button
One-use "Replay (1×)" button in BPM guessing phase. Replays the target BPM metronome for 2 seconds then resumes slider metronome. Slider is disabled during replay. Grays out after use.

### ✅ Tap tempo input
"Slider / Tap" tab switcher in BPM guessing phase. Tap mode records inter-tap intervals, averages them, and sets BPM live. Resets after 2 seconds of inactivity.

### ✅ Keyboard shortcut hint
Music icon near Undo button (desktop only, hover to show) reveals the full key→note mapping in a tooltip.

---

## 🆕 Ideas / Future

### BPM leaderboard (Priority: Low)
Show top BPM scores globally, similar to the pitch leaderboard. Requires `bpm_sessions` to store initials.

### Share BPM daily result (Priority: Low)
Emoji grid share card for daily BPM (already have share for practice). Show date + BPM sequence context.

---

## 🧹 Cleanup

### ✅ Delete orphaned files
Deleted `components/AppShell.tsx` and `components/BpmGame.tsx` — were for an abandoned tab architecture, not imported anywhere.

---

## ✅ Completed

- ✅ BPM Guesser game mode (listen → slider → score, 5 rounds)
- ✅ Live metronome during guessing phase (slider updates BPM in real time)
- ✅ Beat-synced visual pulse (ring + dot animations, `key={pulseKey}` remount trick)
- ✅ Top mode-switcher navbar (Pitch / BPM pill)
- ✅ Context-aware Articles/Scoring navbar links
- ✅ BPM routes: `/bpm`, `/bpm/articles`, `/bpm/scoring` as proper Next.js pages
- ✅ Continuous decimal BPM scoring (linear interpolation within each tier)
- ✅ Wider BPM scoring tiers (3/8/15/25%)
- ✅ SEO: Full JSON-LD, BreadcrumbList, sitemap, keywords sitewide
- ✅ Bug fix: removed double score POST
- ✅ Toast notifications replacing all `alert()` calls
- ✅ Real BPM articles at `/bpm/articles/[slug]`
- ✅ Articles render inside card (lib/pitch-articles.ts, lib/bpm-articles.ts)
- ✅ BPM worldwide stats via Supabase
- ✅ BPM personal stats on idle screen + full stats view
- ✅ Daily BPM challenge with streak tracking
- ✅ Replay tempo button (one-use, 2s)
- ✅ Tap tempo input
- ✅ Keyboard shortcut tooltip
- ✅ BPM new best badge on final screen
- ✅ Orphaned file cleanup (AppShell, BpmGame)
