# KBY MAX Content Scope Cleanup

## Goal

KBY MAX should ship as a movies and TV shows app only. The retired content category should be removed from visible pages, routing, data fetching, player URL helpers, resume storage, tests, and project documentation.

## Scope

- Keep movie, TV show, K-drama, genre, search, detail, playback, and resume behavior working.
- Remove the retired category route and any data-source integration that only served that category.
- Remove page metadata and docs that advertise the retired category.
- Add a repository-scope regression test that prevents the retired category name and related provider names from returning in app code or docs.

## Architecture

The app already centralizes browse shelves in `src/homeRows.js`, app routing in `src/App.jsx`, search data in `src/searchCatalog.js`, player URL creation in `src/videasy.js`, and detail-page loading in `src/pages/MovieDetail.jsx`. The cleanup keeps those boundaries and removes retired-category branches instead of introducing a feature flag.

## Testing

Use Node's built-in test runner. The first regression test scans app-owned files for forbidden retired-category/provider terms, then implementation removes the matching source, test, and documentation references. Existing tests continue to cover movie and TV behavior.
