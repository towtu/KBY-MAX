# KBY MAX Hover Controls and Detail Page Redesign

## Goal

Fix the movie card hover preview so its controls are clickable and redesign the movie detail/player page into a cleaner streaming lobby.

## Requirements

- The expanded movie card preview must remain visible while the pointer moves from the poster into the preview panel.
- The preview Play control must be a real navigation target for the movie or series detail/player page.
- The preview dropdown control must be a real control. For this iteration it opens the same detail page, matching the app's current information flow.
- The card must avoid invalid nested interactive elements. The poster, preview art, Play control, title, and dropdown can each navigate, but they cannot be nested inside one large parent link.
- Mobile and touch layouts should keep the simpler poster card interaction rather than relying on hover.
- The movie detail page should look like a streaming lobby: large readable title, useful metadata, watch action, overview, cast, and a prominent player area.
- The redesign must avoid gradients and keep the dark KBY MAX visual style.

## Design

The movie card becomes a non-link article with explicit links/buttons inside it. The hover preview is an absolutely positioned child with pointer events enabled. CSS keeps the preview visible on hover and focus-within, which allows the cursor and keyboard focus to move into the controls without collapsing it.

The movie detail page keeps the existing data and player embed, but changes the layout. A compact cinematic header presents the title, metadata, genres, overview, and actions next to a poster. The player moves into a theatre-style section directly below the header, followed by cast. This reduces clutter, makes the watch flow clearer, and keeps everything readable without decorative gradients.

## Verification

- Unit tests verify movie card action hrefs and detail helpers.
- Browser verification confirms hover controls are reachable and clickable.
- `npm test`, `npm run lint`, and `npm run build` must pass.
