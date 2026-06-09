# KBY MAX ViXsrc Player Fallback

## Goal

Add ViXsrc as the preferred playback provider while retaining VidLink and
Videasy as fallback servers for every TMDB movie and TV detail page.

## Approved Behavior

- Server 1 is ViXsrc.
- Server 2 is VidLink.
- Server 3 is Videasy.
- ViXsrc movie embeds use `/movie/{tmdbId}`.
- ViXsrc TV embeds use `/tv/{tmdbId}/{season}/{episode}`.
- ViXsrc receives the existing KBY MAX player colors, disables autoplay, and
  receives saved playback progress through `startAt` when progress is positive.
- The server hint tells the viewer to try another server when playback keeps
  loading.
- Anime remains normal TMDB movie or TV content. ViXsrc is offered for those
  titles, but the UI does not claim guaranteed ViXsrc anime availability.

## Approach

Extend the existing player URL module with ViXsrc constants and movie/TV URL
builders, then prepend ViXsrc in `buildPlayerOptions`. This preserves the
current detail-page component and server selector behavior.

Alternatives considered:

- Add ViXsrc directly inside `MovieDetail.jsx`. Rejected because provider URL
  construction already has a shared, tested module.
- Query the ViXsrc catalog before showing Server 1. Rejected because it would
  add a network dependency and loading state to every detail page, while the
  two fallback servers already handle missing-provider coverage.

## Data Flow

1. `MovieDetail.jsx` passes the TMDB media type, ID, selected season, selected
   episode, and saved progress to `buildPlayerOptions`.
2. The player module builds the ViXsrc, VidLink, and Videasy embed URLs.
3. The detail page selects the first option by default and reloads the iframe
   when the viewer changes server or episode.
4. Existing `PLAYER_EVENT` messages continue updating local playback progress
   and the resume row.

## Error Handling

Provider availability is handled manually through the three server buttons.
No provider health request or automatic failover is added. Invalid or
non-positive saved progress is omitted from the ViXsrc URL.

## Testing

- Add failing unit tests for ViXsrc movie and TV URL construction.
- Update the player-order test to require ViXsrc, VidLink, and Videasy in that
  order.
- Update the detail-page regression test for the three-server fallback hint.
- Run the focused player tests, full test suite, lint, and production build.
