# KBY MAX Hover Controls and Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make movie card hover controls clickable and redesign the movie detail/player page into a cleaner streaming lobby.

**Architecture:** Split route/link helper logic into small pure modules so tests can cover interaction targets without rendering React. Restructure `MovieCard` from one large link into an article with explicit links and controls. Keep `MovieDetail` data fetching intact while replacing the layout and CSS.

**Tech Stack:** React, React Router, Vite, Node test runner, CSS modules by page/component.

---

### Task 1: Add Pure Helpers and Regression Tests

**Files:**
- Create: `src/movieLinks.js`
- Create: `src/movieDetailMeta.js`
- Create: `tests/movieLinks.test.mjs`
- Create: `tests/movieDetailMeta.test.mjs`

- [ ] **Step 1: Write failing tests for card action links**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { getMovieTitle, getMediaLink } from '../src/movieLinks.js';

test('getMediaLink routes movies and series to their detail pages', () => {
  assert.equal(getMediaLink({ id: 10, title: 'Movie title' }), '/movie/10');
  assert.equal(getMediaLink({ id: 20, name: 'Series title' }), '/tv/20');
  assert.equal(getMediaLink({ id: 30, media_type: 'tv', title: 'Tagged series' }), '/tv/30');
});

test('getMovieTitle supports movie, series, and fallback titles', () => {
  assert.equal(getMovieTitle({ title: 'Movie title' }), 'Movie title');
  assert.equal(getMovieTitle({ name: 'Series title' }), 'Series title');
  assert.equal(getMovieTitle({}), 'Untitled');
});
```

- [ ] **Step 2: Write failing tests for detail metadata helpers**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { getDisplayYear, getRuntimeLabel, getScoreLabel } from '../src/movieDetailMeta.js';

test('getDisplayYear reads movie and tv dates', () => {
  assert.equal(getDisplayYear({ release_date: '2026-01-10' }), '2026');
  assert.equal(getDisplayYear({ first_air_date: '2025-03-04' }), '2025');
  assert.equal(getDisplayYear({}), '');
});

test('getRuntimeLabel reads movie runtime and tv episode runtime', () => {
  assert.equal(getRuntimeLabel({ runtime: 122 }), '122 min');
  assert.equal(getRuntimeLabel({ episode_run_time: [48] }), '48 min episodes');
  assert.equal(getRuntimeLabel({}), '');
});

test('getScoreLabel formats vote average as a score', () => {
  assert.equal(getScoreLabel({ vote_average: 8.54 }), 'Score 85');
  assert.equal(getScoreLabel({ vote_average: 0 }), 'Not rated');
});
```

- [ ] **Step 3: Run tests and verify red**

Run: `npm test`
Expected: FAIL because `src/movieLinks.js` and `src/movieDetailMeta.js` do not exist.

- [ ] **Step 4: Implement helpers**

Create `src/movieLinks.js`:

```js
export const getMovieTitle = (movie = {}) => movie.title || movie.name || 'Untitled';

export const getMediaType = (movie = {}) => {
  if (movie.media_type === 'tv' || movie.mediaType === 'tv') return 'tv';
  if (movie.media_type === 'movie' || movie.mediaType === 'movie') return 'movie';
  return movie.name ? 'tv' : 'movie';
};

export const getMediaLink = (movie = {}) => {
  const mediaType = getMediaType(movie);
  return mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;
};
```

Create `src/movieDetailMeta.js`:

```js
export const getDisplayYear = (movie = {}) => {
  const date = movie.release_date || movie.first_air_date;
  return date ? String(new Date(date).getFullYear()) : '';
};

export const getRuntimeLabel = (movie = {}) => {
  if (movie.runtime) return `${movie.runtime} min`;
  const episodeRuntime = movie.episode_run_time?.[0];
  return episodeRuntime ? `${episodeRuntime} min episodes` : '';
};

export const getScoreLabel = (movie = {}) => {
  return movie.vote_average ? `Score ${Math.round(movie.vote_average * 10)}` : 'Not rated';
};
```

- [ ] **Step 5: Run tests and verify green**

Run: `npm test`
Expected: PASS.

### Task 2: Make Hover Preview Interactive

**Files:**
- Modify: `src/components/MovieCard.jsx`
- Modify: `src/components/MovieCard.css`
- Modify: `src/pages/Home.css`

- [ ] **Step 1: Restructure `MovieCard`**

Replace the one-link wrapper with an `article`. Use `Link` for poster/art/title/play/dropdown navigation and `button` for add/rating placeholders. Import helpers from `movieLinks.js`.

- [ ] **Step 2: Update hover CSS**

Set `.card-hover-preview { pointer-events: auto; }`, keep the preview visible for `.movie-card:hover` and `.movie-card:focus-within`, and avoid hiding the poster until the preview is active.

- [ ] **Step 3: Preserve mobile behavior**

Keep the media query that disables the hover preview on touch and small screens.

### Task 3: Redesign Detail and Player Page

**Files:**
- Modify: `src/pages/MovieDetail.jsx`
- Replace: `src/pages/MovieDetail.css`

- [ ] **Step 1: Use helper modules**

Import `getMovieTitle`, `getDisplayYear`, `getRuntimeLabel`, and `getScoreLabel`.

- [ ] **Step 2: Replace layout**

Build a lobby layout with:
- Back button
- Poster
- Title and tagline
- Score/year/runtime metadata
- Genre pills
- Overview
- Watch and trailer actions
- Large theatre player
- Cast row

- [ ] **Step 3: Replace CSS**

Use dark panels, clear spacing, stable responsive dimensions, no gradients, no nested cards, and no text overlap.

### Task 4: Verify

**Files:**
- No new files.

- [ ] **Step 1: Run automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run browser checks**

Use Playwright to:
- Open `http://127.0.0.1:5175/`
- Hover a movie card.
- Move into the preview controls.
- Click Play and verify navigation to `/movie/:id` or `/tv/:id`.
- Open a detail page and capture a screenshot.
- Check browser console for errors.

Expected: hover controls stay reachable, detail page is visually coherent, console has no errors.
