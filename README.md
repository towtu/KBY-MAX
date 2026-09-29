# KBY MAX

KBY MAX is a cinematic streaming-style frontend for browsing movies, TV shows, K-dramas, and anime.

The app focuses on a Netflix-like viewing experience with a distinct black-and-white visual style, bold title pages, responsive browse grids, animated featured content, polished hover previews, and TV-friendly episode navigation.

## What It Includes

- A cinematic home screen with featured titles and curated rows
- Dedicated Movies, TV Shows, and Anime hubs with quick category filters
- Trending, top-rated, genre, K-drama, and anime discovery sections
- Detail pages with posters, backdrops, scores, genres, runtime, cast, crew, and recommendations
- TV-friendly left and right episode controls for large screens
- Search with fallback matching for imperfect spelling
- Local browser history for saved watch progress
- A Zoryva embedded player for movies, TV episodes, and anime episodes

## Content Sources

KBY MAX uses TMDB for movie and TV metadata, AniList for anime metadata, and Zoryva for embedded playback. Anime player links use AniList IDs; movie and TV links use TMDB IDs.

Zoryva documents a close event from its iframe but does not document a playback progress event. Existing local watch history remains readable, while saving new playback progress depends on the player emitting a compatible event.

The app is designed as a responsive frontend experience for mobile, desktop, and TV-sized screens.
