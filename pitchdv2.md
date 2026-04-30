# pitchd. Version 2.0 Changelog

## Core Changes & Bug Fixes
* **Mobile Piano Optimization**: The piano keyboard width dynamically scales on mobile using `calc()`, ensuring 10 keys perfectly fit the viewport. Note labels (`C`, `D#`, etc.) have been added to the keys to assist users struggling to remember piano layouts.
* **"Posting..." Button Bug**: Fixed an infinite "Posting..." UI lock by correctly implementing a boolean `isPosted` success state after the async Supabase network request.
* **Harmonic Scoring**: Redesigned scoring algorithm from a linear distance penalty to a true music-theory harmonic system, rewarding octaves, perfect fifths, and accidental intervals.
* **Strict Score Submissions**: Players must now enter their 3-letter initials. If they try to submit without initials, the input box flashes red and shakes via a custom CSS `@keyframes` animation.

## Growth & Retention Features
* **Wordle Viral Loop (Dynamic OG Images)**: 
  * Implemented `@vercel/og` image generation.
  * Created the `/api/og` route to mathematically draw an Open Graph preview card with the player's exact Score, Rank Percentile, and Daily Streak.
  * Updated the "Share" clipboard text to generate a unique `https://pitchd.net/share?...` link that renders the custom image on Discord/Twitter before redirecting to the game.
* **Daily Streaks**: 
  * Integrated a `localStorage` streak engine.
  * Tracks consecutive daily sessions and appends a `🔥 X Day Streak` emoji text to the player's shareable clipboard snippet.

## SEO & Architecture
* **Domain Finalization**: Updated all absolute URLs across the codebase from `pitchd.app` to the live domain `pitchd.net`.
* **High-Res Branding**: Replaced the inline SVG favicon with a custom-generated, high-resolution purple-on-black app icon (`/icon.png`, `/apple-icon.png`, `/og.png`), instantly boosting Google Search legitimacy.
* **Long-Tail SEO Funnel (`/articles`)**: 
  * Engineered a fully functional, scrollable blog architecture using Next 15+ async dynamic routes.
  * Created an index page and individual `/articles/[slug]` routes designed to capture organic search traffic and aggressively funnel readers back to the game.
* **Sitemap Expansion**: Added the new article routes to the dynamically generated `sitemap.ts` to ensure Googlebot crawls the new SEO funnel.
* **UX/UI Polish**: Removed strict `overflow-hidden` constraints from the global HTML body to restore native scrolling for text pages, while keeping the main game viewport safely locked to `100dvh`. Added a sleek, glassmorphic footer linking to articles and your personal socials.


---

## Drafted Reddit Post

**Title:** I listened to your feedback! Updated my Perfect Pitch game with mobile keys, better scoring, and daily streaks! 🎵

**Body:**
Hey guys! Last week I posted my perfect pitch ear-training game, pitchd.net. The response was incredible, but you guys also gave me some really valid constructive criticism. 

I spent the weekend implementing your feedback, and just pushed a massive v2 update!

Here is what's new based on your suggestions:
* **Mobile Keyboard Fix:** A lot of you said the keyboard was too big on mobile and hard to navigate. I've completely redesigned the mobile layout so all 10 active keys fit perfectly on the screen, AND I added note labels (C, D#, etc.) directly onto the keys so you don't have to guess where you are!
* **Bug Fixes:** Fixed the bug where the "Submit Score" button would get stuck permanently saying "Posting..." after you submitted. It now properly confirms your score!
* **Smarter Scoring:** The scoring algorithm now uses actual music theory. Instead of just penalizing you for being far away, you now get partial credit for harmonic relationships (like hitting a perfect fifth or the correct note an octave up).
* **Daily Streaks & Share Cards:** If you play the daily mode, it now tracks your daily streak! Also, when you hit "Share", it generates a really cool custom image card with your exact score and percentile.

Thank you so much to everyone who played and gave feedback. If you have a few minutes, give the new daily sequence a try and let me know if the mobile experience feels better! 

Play it here: https://pitchd.net
