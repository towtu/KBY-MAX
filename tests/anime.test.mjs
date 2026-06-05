import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAnimeEpisodeCards, mapAniListMediaToCard, stripAniListHtml } from '../src/anime.js';

test('stripAniListHtml removes simple AniList markup', () => {
  assert.equal(stripAniListHtml('A <b>bright</b><br>story'), 'A bright story');
});

test('mapAniListMediaToCard normalizes AniList media for movie cards', () => {
  const item = mapAniListMediaToCard({
    id: 21,
    title: { english: null, romaji: 'One Piece', native: 'ONE PIECE' },
    coverImage: { extraLarge: 'https://img.example/one-piece.jpg', large: 'https://img.example/large.jpg' },
    bannerImage: 'https://img.example/banner.jpg',
    averageScore: 86,
    genres: ['Action', 'Adventure'],
    startDate: { year: 1999 },
    episodes: 1100,
    duration: 24,
    description: 'Pirates and dreams.'
  });

  assert.equal(item.id, 21);
  assert.equal(item.mal_id, null);
  assert.equal(item.media_type, 'anime');
  assert.equal(item.title, 'One Piece');
  assert.equal(item.poster_path, 'https://img.example/one-piece.jpg');
  assert.equal(item.vote_average, 8.6);
  assert.equal(item.first_air_date, '1999-01-01');
  assert.equal(item.genre_ids[0], 'anime-action');
});

test('mapAniListMediaToCard preserves MyAnimeList id for anime embeds', () => {
  const item = mapAniListMediaToCard({
    id: 16498,
    idMal: 16498,
    title: { romaji: 'Attack on Titan' },
    coverImage: { large: 'https://img.example/aot.jpg' }
  });

  assert.equal(item.id, 16498);
  assert.equal(item.mal_id, 16498);
});

test('buildAnimeEpisodeCards uses AniList streaming episode titles and thumbnails with fallback cards', () => {
  const episodes = buildAnimeEpisodeCards({
    episodes: 3,
    bannerImage: 'https://img.example/banner.jpg',
    streamingEpisodes: [
      { title: 'Episode 1 - Up Ahead', thumbnail: 'https://img.example/e1.jpg' },
      { title: 'Episode 3: The Path of the Victor', thumbnail: 'https://img.example/e3.jpg' }
    ]
  });

  assert.deepEqual(
    episodes.map((episode) => [episode.episode_number, episode.name, episode.still_path]),
    [
      [1, 'Up Ahead', 'https://img.example/e1.jpg'],
      [2, 'Episode 2', 'https://img.example/banner.jpg'],
      [3, 'The Path of the Victor', 'https://img.example/e3.jpg']
    ]
  );
});
