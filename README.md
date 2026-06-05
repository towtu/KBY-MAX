# KBY MAX

KBY MAX is a React and Vite streaming-style movie, TV, and anime frontend.

## Features

- Cinematic home page with rotating featured titles
- Movies, TV Shows, New & Popular, and My List browse sections
- TMDB-powered movie and TV metadata
- AniList-powered anime metadata
- Videasy and VidLink iframe player options
- Local watch progress and My List behavior through browser storage
- Responsive layouts for mobile, desktop, and TV-sized screens

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build
```

## Vercel

Vercel can deploy this as a Vite app.

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites are configured in `vercel.json`
