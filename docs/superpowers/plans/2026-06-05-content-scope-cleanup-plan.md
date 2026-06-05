# KBY MAX Content Scope Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the retired content category from KBY MAX so the app and repository are scoped to movies and TV shows.

**Architecture:** Keep the existing React/Vite file boundaries. Remove category-specific branches from routing, browse/search data, detail playback, API helpers, resume storage, documentation, and tests. Add a repository-scope regression test that catches reintroduced retired-category/provider terms in app-owned files.

**Tech Stack:** React 19, Vite 8, React Router, Node test runner, ESLint.

---

### Task 1: Add Scope Regression

**Files:**
- Create: `tests/contentScope.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const rootDir = new URL('..', import.meta.url).pathname;
const deniedTerms = [
  ['a', 'n', 'i', 'm', 'e'].join(''),
  ['a', 'n', 'i', 'l', 'i', 's', 't'].join(''),
  ['m', 'y', 'a', 'n', 'i', 'm', 'e', 'l', 'i', 's', 't'].join('')
];
const ignoredDirs = new Set(['.git', 'dist', 'node_modules', 'output']);
const ignoredFiles = new Set([
  'docs/superpowers/specs/2026-06-05-content-scope-cleanup-design.md',
  'docs/superpowers/plans/2026-06-05-content-scope-cleanup-plan.md',
  'tests/contentScope.test.mjs'
]);

const collectFiles = (dir) => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const relativePath = relative(rootDir, path);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return ignoredDirs.has(entry) ? [] : collectFiles(path);
    }

    if (!stats.isFile() || ignoredFiles.has(relativePath)) return [];
    return [path];
  });
};

test('app-owned files do not mention retired category providers', () => {
  const matches = collectFiles(rootDir).flatMap((path) => {
    const relativePath = relative(rootDir, path);
    const content = readFileSync(path, 'utf8').toLowerCase();

    return deniedTerms
      .filter((term) => content.includes(term))
      .map((term) => `${relativePath}: ${term}`);
  });

  assert.deepEqual(matches, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/contentScope.test.mjs`
Expected: FAIL with matches in existing app files.

### Task 2: Remove Retired Category Source

**Files:**
- Delete: legacy retired-category source module
- Delete: legacy retired-category test files
- Delete: legacy retired-category generated spec and plan docs
- Modify: `src/api.js`
- Modify: `src/videasy.js`
- Modify: `src/movieDetailMeta.js`
- Modify: `src/pages/MovieDetail.jsx`
- Modify: `src/pages/MovieDetail.css`
- Modify: `src/components/MovieCard.jsx`
- Modify: `tests/api.test.mjs`
- Modify: `tests/videasy.test.mjs`
- Modify: `tests/movieDetailMeta.test.mjs`
- Modify: `tests/responsiveScrollbars.test.mjs`

- [ ] **Step 1: Remove provider API helpers and tests**

Remove retired provider imports, query constants, exported fetch/search/detail helpers, and matching API tests. Keep TMDB movie and TV helpers unchanged.

- [ ] **Step 2: Remove player helper and tests**

Remove the retired category URL builder from `src/videasy.js` and its test expectations.

- [ ] **Step 3: Simplify detail page**

Remove the retired-category prop, state, progress key, fetch branch, episode rail, player URL branch, facts, labels, and CSS selectors. Movie and TV paths remain.

- [ ] **Step 4: Remove card label branch**

Use only `Series` and `Movie` labels in `src/components/MovieCard.jsx`.

### Task 3: Remove Visible Surface References

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: `src/App.jsx`
- Modify: `src/homeRows.js`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Browse.jsx`
- Modify: `src/searchCatalog.js`
- Modify: `src/localResume.js`
- Modify: `src/movieLinks.js`
- Modify: `tests/homeRows.test.mjs`
- Modify: `tests/localResume.test.mjs`
- Modify: `tests/movieLinks.test.mjs`

- [ ] **Step 1: Keep app shelves to movies and TV**

Remove retired category browse config, home row input, browse hub quick link, data fetching, and search fallback calls.

- [ ] **Step 2: Keep resume and links to movies and TV**

Reject retired-category resume entries and route unknown content to movie or TV paths only.

- [ ] **Step 3: Rewrite visible copy**

Update README and `index.html` to describe movies and TV shows only.

### Task 4: Verify And Ship

**Files:**
- Modify only files changed above.

- [ ] **Step 1: Run focused regression**

Run: `npm test tests/contentScope.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run full tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 5: Commit and push**

Use the configured Git author only. Commit message: `Remove retired content category`. Do not include co-author trailers or AI metadata. Push `main` to `origin`.
