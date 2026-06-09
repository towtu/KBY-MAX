# ViXsrc Player Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ViXsrc the default movie and TV playback server while keeping VidLink and Videasy as two manual fallbacks.

**Architecture:** Extend the existing `src/videasy.js` provider URL module instead of adding provider-specific logic to the React detail page. `buildPlayerOptions` will return three ordered provider descriptors, and `MovieDetail.jsx` will continue rendering the shared selector and iframe from those descriptors.

**Tech Stack:** React 19, JavaScript ES modules, Node.js built-in test runner, ESLint, Vite

---

## File Structure

- Modify `src/videasy.js`: define ViXsrc configuration and URL builders, then order all three playback providers.
- Modify `tests/videasy.test.mjs`: specify exact ViXsrc URL behavior and three-provider ordering.
- Modify `src/pages/MovieDetail.jsx`: update the manual fallback hint for three servers.
- Modify `tests/moviePlayerFallback.test.mjs`: lock in the provider-agnostic fallback copy.

### Task 1: Add ViXsrc URL Builders and Server Ordering

**Files:**
- Modify: `tests/videasy.test.mjs`
- Modify: `src/videasy.js`

- [ ] **Step 1: Write failing ViXsrc URL tests**

Update the imports in `tests/videasy.test.mjs`:

```js
import {
  buildPlayerOptions,
  buildVidLinkMovieUrl,
  buildVidLinkTvUrl,
  buildVideasyMovieUrl,
  buildVideasyTvUrl,
  buildVixSrcMovieUrl,
  buildVixSrcTvUrl
} from '../src/videasy.js';
```

Add these tests after the Videasy tests:

```js
test('buildVixSrcMovieUrl builds a branded movie embed with progress', () => {
  assert.equal(
    buildVixSrcMovieUrl({ id: 786892, progress: 120 }),
    'https://vixsrc.to/movie/786892?primaryColor=17c3d1&secondaryColor=101720&autoplay=false&startAt=120'
  );
});

test('buildVixSrcTvUrl builds a branded TV episode embed', () => {
  assert.equal(
    buildVixSrcTvUrl({ id: 1429, season: 2, episode: 3 }),
    'https://vixsrc.to/tv/1429/2/3?primaryColor=17c3d1&secondaryColor=101720&autoplay=false'
  );
});

test('buildVixSrcMovieUrl omits invalid progress', () => {
  assert.equal(
    buildVixSrcMovieUrl({ id: 786892, progress: -5 }),
    'https://vixsrc.to/movie/786892?primaryColor=17c3d1&secondaryColor=101720&autoplay=false'
  );
});
```

- [ ] **Step 2: Update the ordering test to require three servers**

Replace the existing `buildPlayerOptions` test with:

```js
test('buildPlayerOptions prefers ViXsrc and keeps two fallback servers', () => {
  const options = buildPlayerOptions({
    mediaType: 'tv',
    id: 1429,
    season: 2,
    episode: 3,
    progress: 120
  });

  assert.deepEqual(
    options.map(({ id, label, name }) => ({ id, label, name })),
    [
      { id: 'vixsrc', label: 'Server 1', name: 'ViXsrc' },
      { id: 'vidlink', label: 'Server 2', name: 'VidLink' },
      { id: 'videasy', label: 'Server 3', name: 'Videasy' }
    ]
  );
  assert.match(options[0].src, /^https:\/\/vixsrc\.to\/tv\/1429\/2\/3\?/);
  assert.match(options[1].src, /^https:\/\/vidlink\.pro\/tv\/1429\/2\/3\?/);
  assert.match(options[2].src, /^https:\/\/player\.videasy\.to\/tv\/1429\/2\/3\?/);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
node --test tests/videasy.test.mjs
```

Expected: FAIL because `buildVixSrcMovieUrl` and `buildVixSrcTvUrl` are not exported, and the current server order only contains VidLink and Videasy.

- [ ] **Step 4: Add ViXsrc constants and parameter construction**

At the top of `src/videasy.js`, add:

```js
export const VIXSRC_BASE_URL = 'https://vixsrc.to';
```

After `vidLinkParams`, add:

```js
const vixSrcParams = (progress = 0) => {
  const params = [
    ['primaryColor', VIDEASY_COLOR],
    ['secondaryColor', VIDLINK_SECONDARY_COLOR],
    ['autoplay', 'false']
  ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['startAt', normalizedProgress]);
  }

  return params;
};
```

- [ ] **Step 5: Add movie and TV URL builders**

Add before the VidLink builders:

```js
export const buildVixSrcMovieUrl = ({ id, progress = 0 }) => {
  return buildExternalUrl(VIXSRC_BASE_URL, `/movie/${id}`, vixSrcParams(progress));
};

export const buildVixSrcTvUrl = ({ id, season = 1, episode = 1, progress = 0 }) => {
  return buildExternalUrl(
    VIXSRC_BASE_URL,
    `/tv/${id}/${season || 1}/${episode || 1}`,
    vixSrcParams(progress)
  );
};
```

- [ ] **Step 6: Prepend ViXsrc and relabel the fallback servers**

Inside `buildPlayerOptions`, construct `vixSrc` before the existing provider URLs:

```js
const vixSrc = mediaType === 'tv'
  ? buildVixSrcTvUrl({ id, season, episode, progress })
  : buildVixSrcMovieUrl({ id, progress });
```

Replace the returned array with:

```js
return [
  { id: 'vixsrc', label: 'Server 1', name: 'ViXsrc', src: vixSrc },
  { id: 'vidlink', label: 'Server 2', name: 'VidLink', src: vidLinkSrc },
  { id: 'videasy', label: 'Server 3', name: 'Videasy', src: videasySrc }
].filter((option) => option.src);
```

- [ ] **Step 7: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/videasy.test.mjs
```

Expected: all tests in `tests/videasy.test.mjs` pass.

- [ ] **Step 8: Commit the provider integration**

```bash
git add src/videasy.js tests/videasy.test.mjs
git commit -m "Add ViXsrc playback server"
```

### Task 2: Update Fallback Copy and Verify the Application

**Files:**
- Modify: `tests/moviePlayerFallback.test.mjs`
- Modify: `src/pages/MovieDetail.jsx`

- [ ] **Step 1: Write the failing detail-page copy test**

Replace the fallback-copy assertion in `tests/moviePlayerFallback.test.mjs`:

```js
assert.match(detailSource, /If playback keeps loading, try another server\./);
assert.doesNotMatch(detailSource, /try the other server\./);
```

Keep the existing `buildPlayerOptions` assertion and inline single-provider guard.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/moviePlayerFallback.test.mjs
```

Expected: FAIL because `MovieDetail.jsx` still says “try the other server.”

- [ ] **Step 3: Update the player hint**

In `src/pages/MovieDetail.jsx`, replace:

```jsx
<p className="player-server-hint">If playback keeps loading, try the other server.</p>
```

with:

```jsx
<p className="player-server-hint">If playback keeps loading, try another server.</p>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/moviePlayerFallback.test.mjs
```

Expected: the detail-page fallback test passes.

- [ ] **Step 5: Run all automated tests**

Run:

```bash
npm test
```

Expected: exit code 0 with no failed tests.

- [ ] **Step 6: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 7: Build the production bundle**

Run:

```bash
npm run build
```

Expected: exit code 0 and a successful Vite production build.

- [ ] **Step 8: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
git diff -- src/videasy.js tests/videasy.test.mjs src/pages/MovieDetail.jsx tests/moviePlayerFallback.test.mjs
```

Expected: no whitespace errors; only the planned provider and fallback-copy files are uncommitted.

- [ ] **Step 9: Commit the detail-page update**

```bash
git add src/pages/MovieDetail.jsx tests/moviePlayerFallback.test.mjs
git commit -m "Update three-server fallback guidance"
```

- [ ] **Step 10: Verify the committed state**

Run:

```bash
git status --short --branch
git log -3 --oneline
```

Expected: a clean working tree with the design commit and two implementation commits at the top of `main`.
