# Zoryva and anime integration

## Goal

Finish the in-progress Zoryva player switch and make anime usable across KBY MAX.

## Data and playback

TMDB continues to supply movie and TV metadata. AniList supplies anime metadata and AniList IDs. Zoryva supplies a single embedded player for all three types. Its documented paths are `/embed/movie/{tmdb_id}`, `/embed/tv/{tmdb_id}/{season}/{episode}`, and `/embed/anime/{anilist_id}/{season}/{episode}`. Resume URLs use `startAt` in seconds, and autoplay stays off until the viewer starts playback. Zoryva's own player handles source selection.

## User flow

The Anime navigation opens an anime browse hub with trending and popular filters. Home shows trending anime. Search combines TMDB and AniList results, and anime cards open the existing in-progress anime detail page. The detail page shows AniList metadata, episode selection, and a Zoryva iframe. Movies and TV retain their detail pages and use the same player integration.

## Reliability

AniList errors fail the affected request without stopping TMDB shelves. Empty anime results show the existing browse empty state. The player URL module validates IDs and clamps resume seconds. Embed messages are accepted only from Zoryva; the documented close event is the only guaranteed message. Existing stored resume records remain readable, but new progress cannot be guaranteed without a documented Zoryva progress event.

## Verification

Cover URL generation, anime API mapping, browse routing, search merging, and navigation with automated tests. Run the full test, lint, and build commands. Check movie, TV, and anime routes in a browser.
