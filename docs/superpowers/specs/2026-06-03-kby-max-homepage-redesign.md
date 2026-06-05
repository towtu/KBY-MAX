# KBY MAX Homepage Redesign

Date: 2026-06-03

## Goal

Refresh the KBY MAX homepage so it feels like a polished streaming app without copying Netflix's giant numbered Top 10 treatment. The design should keep fast horizontal browsing, add more varied movie and show rows, avoid decorative gradients, and support a local-only resume row without requiring accounts.

## Approved Direction

Use a no-gradient cinematic streaming layout:

- Solid black and dark charcoal surfaces.
- Real poster and backdrop imagery as the main visual material.
- Crisp borders, subtle shadows, compact color accents, and restrained motion.
- No decorative gradient backgrounds or gradient-only visual treatments.
- Familiar streaming rows, but with more row variety than repeated poster rails.
- A Top 10 section with compact rank badges/cards instead of oversized outlined numbers.

## Homepage Structure

The homepage will keep a featured hero at the top, then use a deeper set of rows:

- Featured hero using a real backdrop from the selected trending title.
- Top 10 on KBY MAX using compact rank badges.
- Trending Movies as the default primary movie row.
- Trending Shows for TV variety.
- Binge-Worthy K-Dramas.
- Action Rush.
- Horror & Suspense.
- Comedy Picks.
- Romance & Drama.
- Family Night.
- Hidden Gems or Critically Acclaimed.
- Optional Pick Up Where You Left Off, shown only when local playback progress exists.

Rows may use different treatments where useful:

- Standard poster rails for most content.
- Ranked cards for Top 10.
- Wide channel cards for curated category entry points such as 90-minute thrillers, K-Drama Night, Action Rush, and Comfort Comedy.
- Mood/category chips as secondary browsing entry points, not as the main content.

## Local Resume Behavior

No account system will be introduced.

The app may use `localStorage` for resume history because movie detail pages already save playback progress locally. The homepage should only show Pick Up Where You Left Off when this browser has saved progress. If no progress exists, the row is hidden and Trending Movies remains the default row.

The row label should make the behavior feel local and lightweight. It should not imply cross-device sync or accounts.

## Data And API

Use TMDB endpoints already represented in the codebase and add focused category fetchers as needed:

- Trending all/day for hero and mixed trending.
- Movie popular or trending movies for Top 10 and Trending Movies.
- TV popular or trending TV for Trending Shows.
- Discover TV with Korean original language for K-Dramas.
- Discover movie rows by genre for action, horror, comedy, romance/drama, family, and hidden gems.

All new API calls should use the existing timeout-aware `fetchJson` helper so stalled requests do not cause endless loading.

## Components

Keep the implementation close to the current React structure:

- `Home.jsx` remains the homepage container and data orchestrator.
- `MovieCard.jsx` remains the reusable poster card.
- Add small row helpers/components only if they reduce duplication or make ranked/wide rows clearer.
- CSS can stay in `Home.css` and `MovieCard.css` unless component boundaries become too hard to read.

## Responsive Behavior

The redesigned homepage must work at common mobile and desktop widths:

- Desktop: richer hero and wider rows with visible scroll controls.
- Tablet: fewer cards per row, consistent spacing, no text overlap.
- Mobile: compact hero, no hover-only dependency, rows remain horizontally scrollable.

Text inside buttons, badges, cards, and headings must fit without overlapping.

## Error And Empty States

If a category request fails, the homepage should still render other successful rows.

If a row has no content, omit that row instead of showing an empty section. If all homepage data fails, show a concise retry/error state instead of an endless spinner.

## Verification

Before completion, run:

- `npm test`
- `npm run lint`
- `npm run build`

Also verify the running app in a browser at desktop and mobile-sized viewports:

- Homepage gets past loading.
- Hero renders with real imagery when data exists.
- Top 10 uses compact rank badges, not giant Netflix-like numbers.
- Multiple varied rows are present.
- No decorative gradient backgrounds remain in the homepage redesign.
- Local resume row is hidden when there is no saved progress.
