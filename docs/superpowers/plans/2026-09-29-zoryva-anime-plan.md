# Zoryva and Anime Implementation Plan

> **For agentic workers:** Execute the checked tasks in order. Use test-first development for behavior changes.

**Goal:** Finish the Zoryva player migration and expose a working anime catalog, search, and detail flow.

**Architecture:** Keep TMDB and AniList metadata in `src/api.js` and isolate Zoryva embed construction in `src/playerUrls.js`. Existing page components consume normalized media objects and one player URL. No new service or dependency is required.

**Tech Stack:** React, Vite, Node test runner, AniList GraphQL, TMDB, Zoryva iframe.

---

### Task 1: Player URLs

**Files:** Rename `src/videasy.js` to `src/playerUrls.js`; replace `tests/videasy.test.mjs` with `tests/playerUrls.test.mjs`; update detail page imports.

- [x] Specify movie, TV, and anime URLs using numeric IDs and `startAt=120`; reject invalid IDs and clamp times at 86,400 seconds.
- [x] Run `node --test tests/playerUrls.test.mjs` and confirm the new expectations fail.
- [x] Implement the URL builder and a single Zoryva player descriptor.
- [x] Rerun the focused test and confirm it passes.

### Task 2: AniList catalog

**Files:** `src/api.js`, `tests/api.test.mjs`, `src/pages/Browse.jsx`, `src/searchCatalog.js`, `tests/searchCatalog.test.mjs`.

- [x] Specify AniList trending, popular, detail, and search response handling, including GraphQL errors.
- [x] Run focused API and search tests and confirm the new cases fail.
- [x] Connect the anime browse hub and its filters; merge anime into search results with media-type-aware keys.
- [x] Rerun focused tests and confirm they pass.

### Task 3: Detail and presentation

**Files:** `src/pages/AnimeDetail.jsx`, `src/pages/MovieDetail.jsx`, `src/components/MovieCard.jsx`, `src/pages/Search.jsx`, `tests/navLinks.test.mjs`, `tests/contentScope.test.mjs`.

- [x] Specify Anime navigation and removal of the old two-server controls.
- [x] Run the relevant tests and confirm they fail for the old assumptions.
- [x] Use the one Zoryva player, label anime cards correctly, and accept only Zoryva-origin embed messages.
- [x] Rerun focused tests and confirm they pass.

### Task 4: Documentation and verification

**Files:** `README.md` and tests affected by the new scope.

- [x] Document TMDB, AniList, Zoryva, and the playback-progress limitation.
- [x] Run `npm test`, `npm run lint`, and `npm run build`.
- [x] Check representative movie, TV, and anime flows in a browser and inspect `git diff --check`.
