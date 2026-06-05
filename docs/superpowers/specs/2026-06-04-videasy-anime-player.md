# KBY MAX Videasy And Anime Update

## Goal

Replace the detail-page embed with Videasy, add anime rows/details from public AniList data, fix score display to decimal averages, and improve the detail lobby with real recommendations.

## Requirements

- Use Videasy iframe URLs instead of Vidking.
- Keep player customization to supported iframe URL parameters.
- Do not store or expose the AniList client secret in frontend code.
- Add anime content using AniList public GraphQL data.
- Route anime cards to `/anime/:id`.
- Show scores as decimal averages such as `5.8`, not multiplied integer scores such as `58`.
- Add TV/anime episode controls outside the iframe.
- Add real recommendations on detail pages when the upstream API provides them.
- Preserve the existing no-gradient design direction.

## Non-Goals

- Build a fully custom native video player. Videasy only exposes iframe-level controls without direct media streams.
- Add AniList OAuth/account features.
- Persist watch state to a backend.
