import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHomeRows, MOVIE_CATEGORY_ROWS } from '../src/homeRows.js';
import * as homeRows from '../src/homeRows.js';

test('buildHomeRows hides local resume when there are no resume items', () => {
  const rows = buildHomeRows({
    resumeItems: [],
    trendingMovies: [{ id: 1 }],
    topTen: [{ id: 2 }]
  });

  assert.equal(rows.some((row) => row.id === 'resume'), false);
  assert.equal(rows.some((row) => row.id === 'trending-movies'), true);
});

test('buildHomeRows shows local resume before trending movies when items exist', () => {
  const rows = buildHomeRows({
    resumeItems: [{ id: 1 }],
    trendingMovies: [{ id: 2 }],
    trendingAnime: [{ id: 4 }],
    topTen: [{ id: 3 }]
  });

  assert.deepEqual(rows.slice(0, 3).map((row) => row.id), ['top-ten', 'resume', 'trending-movies']);
  assert.equal(rows.some((row) => row.id === 'anime-spotlight'), true);
});

test('buildHomeRows gives content rows browse paths but leaves resume local', () => {
  const rows = buildHomeRows({
    resumeItems: [{ id: 1 }],
    trendingMovies: [{ id: 2 }],
    topTen: [{ id: 3 }]
  });

  assert.equal(rows.find((row) => row.id === 'top-ten')?.browsePath, '/browse/top-ten');
  assert.equal(rows.find((row) => row.id === 'trending-movies')?.browsePath, '/browse/trending-movies');
  assert.equal(rows.find((row) => row.id === 'resume')?.browsePath, '');
});

test('movie category rows include varied streaming genres', () => {
  assert.deepEqual(
    MOVIE_CATEGORY_ROWS.map((row) => row.id),
    ['action', 'horror', 'comedy', 'romance-drama', 'family', 'hidden-gems']
  );
});

test('home row config does not expose search-only channel or mood sections', () => {
  assert.equal('CHANNEL_CARDS' in homeRows, false);
  assert.equal('MOOD_CHIPS' in homeRows, false);
});

test('browse configs expose a local My List shelf', () => {
  assert.deepEqual(
    homeRows.getBrowseRowConfig('my-list'),
    {
      id: 'my-list',
      title: 'My List',
      note: 'Saved on this browser',
      source: 'resume'
    }
  );
});

test('browse configs expose refined Movies and TV Shows hubs', () => {
  const movies = homeRows.getBrowseRowConfig('movies');
  const tvShows = homeRows.getBrowseRowConfig('tv-shows');

  assert.equal(movies?.source, 'moviesHub');
  assert.equal(movies?.title, 'Movies');
  assert.deepEqual(
    movies?.quickLinks?.map((link) => link.id),
    ['trending-movies', 'action', 'horror', 'comedy', 'family', 'top-rated']
  );

  assert.equal(tvShows?.source, 'tvHub');
  assert.equal(tvShows?.title, 'TV Shows');
  assert.deepEqual(
    tvShows?.quickLinks?.map((link) => link.id),
    ['trending-shows', 'k-dramas', 'anime-spotlight', 'tv-drama', 'tv-comedy']
  );
});
