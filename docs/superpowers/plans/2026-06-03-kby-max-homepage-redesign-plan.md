# KBY MAX Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved no-gradient streaming homepage with compact Top 10 ranks, more varied rows, and local-only resume behavior.

**Architecture:** Keep the current Vite/React structure. Add small pure helper modules for category row configuration and local resume storage, expand TMDB API fetchers through the existing timeout-aware helper, and update `Home.jsx` plus CSS for the redesigned homepage.

**Tech Stack:** React 19, Vite, react-router-dom, lucide-react, Node built-in test runner.

---

## File Structure

- Modify `src/api.js`: add category fetchers for trending movies, trending shows, and discover movie rows.
- Create `src/localResume.js`: read/write local-only resume items from `localStorage`.
- Create `src/homeRows.js`: centralize row labels, discover genre IDs, and visible row filtering.
- Modify `src/pages/Home.jsx`: load rows resiliently with `Promise.allSettled`, render ranked cards, standard poster rows, wide channel cards, mood chips, optional resume row, and retry/error state.
- Modify `src/pages/Home.css`: implement approved no-gradient homepage styling.
- Modify `src/components/MovieCard.css`, `src/components/Navbar.css`, and `src/pages/MovieDetail.css`: remove remaining CSS gradient treatments.
- Modify `src/pages/MovieDetail.jsx`: save local resume metadata when playback progress is reported.
- Add/modify tests in `tests/api.test.mjs`, `tests/localResume.test.mjs`, and `tests/homeRows.test.mjs`.

## Task 1: API Category Fetchers

**Files:**
- Modify: `src/api.js`
- Test: `tests/api.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests proving category APIs route through `fetchJson` with correct TMDB paths:

```js
import { fetchDiscoverMovies, fetchTrendingMovies, fetchTrendingTV } from '../src/api.js';

test('fetchTrendingMovies calls the movie trending endpoint', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };
  await fetchTrendingMovies({ fetcher });
  assert.equal(urls[0], 'https://api.themoviedb.org/3/trending/movie/day?language=en-US');
});

test('fetchTrendingTV calls the tv trending endpoint', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };
  await fetchTrendingTV({ fetcher });
  assert.equal(urls[0], 'https://api.themoviedb.org/3/trending/tv/day?language=en-US');
});

test('fetchDiscoverMovies builds genre discovery URLs', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };
  await fetchDiscoverMovies({ withGenres: '28,12', sortBy: 'vote_average.desc', fetcher });
  assert.equal(urls[0], 'https://api.themoviedb.org/3/discover/movie?language=en-US&page=1&sort_by=vote_average.desc&with_genres=28%2C12');
});
```

- [ ] **Step 2: Run tests to verify red**

Run: `npm test`

Expected: fails because the new API functions are not exported.

- [ ] **Step 3: Implement API fetchers**

Add `requestOptions` passthrough support so tests can inject `fetcher`, then add:

```js
export const fetchTrendingMovies = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/trending/movie/day?language=en-US`, requestOptions);
};

export const fetchTrendingTV = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/trending/tv/day?language=en-US`, requestOptions);
};

export const fetchDiscoverMovies = async ({
  withGenres,
  sortBy = 'popularity.desc',
  page = 1,
  ...requestOptions
} = {}) => {
  const params = new URLSearchParams({
    language: 'en-US',
    page: String(page),
    sort_by: sortBy
  });

  if (withGenres) {
    params.set('with_genres', withGenres);
  }

  return fetchJson(`${BASE_URL}/discover/movie?${params.toString()}`, requestOptions);
};
```

- [ ] **Step 4: Run tests to verify green**

Run: `npm test`

Expected: all tests pass.

## Task 2: Local Resume Storage

**Files:**
- Create: `src/localResume.js`
- Test: `tests/localResume.test.mjs`
- Modify: `src/pages/MovieDetail.jsx`

- [ ] **Step 1: Write failing tests**

Create tests for hidden-by-default behavior and sorted local resume items:

```js
import { getResumeItems, saveResumeItem } from '../src/localResume.js';

const createStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
};

test('getResumeItems returns an empty list when localStorage has no history', () => {
  assert.deepEqual(getResumeItems(createStorage()), []);
});

test('saveResumeItem stores progress items sorted by most recent update', () => {
  const storage = createStorage();
  saveResumeItem({ id: 1, mediaType: 'movie', title: 'Older', posterPath: '/old.jpg', progress: 120, updatedAt: 10 }, storage);
  saveResumeItem({ id: 2, mediaType: 'tv', title: 'Newer', posterPath: '/new.jpg', progress: 300, updatedAt: 20 }, storage);
  assert.deepEqual(getResumeItems(storage).map((item) => item.id), [2, 1]);
});
```

- [ ] **Step 2: Run tests to verify red**

Run: `npm test`

Expected: fails because `src/localResume.js` does not exist.

- [ ] **Step 3: Implement local resume helper**

Implement `RESUME_STORAGE_KEY`, `getResumeItems`, and `saveResumeItem`. Keep only valid items with `id`, `title`, `mediaType`, and `progress > 0`; sort descending by `updatedAt`; limit to 12.

- [ ] **Step 4: Wire MovieDetail metadata saving**

When the embedded player posts a progress event, continue saving `movie_progress_${id}` and also call `saveResumeItem` with `id`, media type, title, poster path, backdrop path, progress seconds, and `Date.now()`.

- [ ] **Step 5: Run tests to verify green**

Run: `npm test`

Expected: all tests pass.

## Task 3: Home Row Configuration

**Files:**
- Create: `src/homeRows.js`
- Test: `tests/homeRows.test.mjs`

- [ ] **Step 1: Write failing tests**

Create tests that enforce row visibility:

```js
import { buildHomeRows, MOVIE_CATEGORY_ROWS } from '../src/homeRows.js';

test('buildHomeRows hides local resume when there are no resume items', () => {
  const rows = buildHomeRows({ resumeItems: [], trendingMovies: [{ id: 1 }], topTen: [{ id: 2 }] });
  assert.equal(rows.some((row) => row.id === 'resume'), false);
  assert.equal(rows.some((row) => row.id === 'trending-movies'), true);
});

test('buildHomeRows shows local resume before trending movies when items exist', () => {
  const rows = buildHomeRows({ resumeItems: [{ id: 1 }], trendingMovies: [{ id: 2 }], topTen: [{ id: 3 }] });
  assert.deepEqual(rows.slice(0, 3).map((row) => row.id), ['top-ten', 'resume', 'trending-movies']);
});

test('movie category rows include varied streaming genres', () => {
  assert.deepEqual(MOVIE_CATEGORY_ROWS.map((row) => row.id), ['action', 'horror', 'comedy', 'romance-drama', 'family', 'hidden-gems']);
});
```

- [ ] **Step 2: Run tests to verify red**

Run: `npm test`

Expected: fails because `src/homeRows.js` does not exist.

- [ ] **Step 3: Implement row helpers**

Export `MOVIE_CATEGORY_ROWS`, `MOOD_CHIPS`, `CHANNEL_CARDS`, and `buildHomeRows(data)`. Omit rows whose `items` array is empty.

- [ ] **Step 4: Run tests to verify green**

Run: `npm test`

Expected: all tests pass.

## Task 4: Homepage Redesign

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Home.css`
- Modify: `src/components/MovieCard.css`
- Modify: `src/components/Navbar.css`
- Modify: `src/pages/MovieDetail.css`

- [ ] **Step 1: Update data loading**

In `Home.jsx`, use `Promise.allSettled` for hero, Top 10, trending movies, trending TV, K-Dramas, top rated, and `MOVIE_CATEGORY_ROWS` discovery requests. This keeps successful rows visible even when one category fails.

- [ ] **Step 2: Add render helpers**

Add helpers for standard rows, ranked rows, wide channel cards, mood chips, loading state, and full error state. Do not render empty rows.

- [ ] **Step 3: Apply no-gradient CSS**

Replace the homepage styling with solid dark surfaces, real images, compact badges, scrollable rows, and responsive rules. Remove `linear-gradient` and other gradient CSS from homepage/card/nav/detail files.

- [ ] **Step 4: Run verification commands**

Run: `npm test`, `npm run lint`, `npm run build`

Expected: all pass.

## Task 5: Browser Verification

**Files:**
- No source files expected unless browser checks reveal a problem.

- [ ] **Step 1: Start or reuse Vite**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite serves a local URL.

- [ ] **Step 2: Verify desktop viewport**

Open the local URL in Playwright. Confirm the homepage renders past loading, has Top 10, Trending Movies, multiple category rows, and no visible broken layout.

- [ ] **Step 3: Verify mobile viewport**

Resize to mobile width. Confirm hero text, row cards, rank badges, and buttons do not overlap.

- [ ] **Step 4: Verify no-gradient rule**

Run: `rg -n "gradient" src --glob '*.css'`

Expected: no CSS gradients remain.
