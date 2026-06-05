import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchDiscoverMovies,
  fetchDiscoverTV,
  fetchJson,
  fetchSeasonDetails,
  fetchTrendingMovies,
  fetchTrendingTV,
  getImageUrl,
} from '../src/api.js';

test('fetchJson times out when the movie API request never settles', async () => {
  const hangingFetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      reject(options.signal.reason);
    });
  });

  await assert.rejects(
    fetchJson('https://api.example.test/hangs', { timeoutMs: 5, fetcher: hangingFetch }),
    /timed out/i
  );
});

test('fetchTrendingMovies calls the movie trending endpoint', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };

  await fetchTrendingMovies({ fetcher });

  assert.equal(urls[0], 'https://api.themoviedb.org/3/trending/movie/day?language=en-US');
});

test('fetchTrendingTV calls the tv trending endpoint', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };

  await fetchTrendingTV({ fetcher });

  assert.equal(urls[0], 'https://api.themoviedb.org/3/trending/tv/day?language=en-US');
});

test('fetchDiscoverMovies builds genre discovery URLs', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };

  await fetchDiscoverMovies({ withGenres: '28,12', sortBy: 'vote_average.desc', fetcher });

  assert.equal(urls[0], 'https://api.themoviedb.org/3/discover/movie?language=en-US&page=1&sort_by=vote_average.desc&with_genres=28%2C12');
});

test('fetchDiscoverTV builds genre discovery URLs', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ results: [] }) };
  };

  await fetchDiscoverTV({ withGenres: '18', sortBy: 'popularity.desc', fetcher });

  assert.equal(urls[0], 'https://api.themoviedb.org/3/discover/tv?language=en-US&page=1&sort_by=popularity.desc&with_genres=18');
});

test('getImageUrl preserves absolute image URLs', () => {
  assert.equal(getImageUrl('https://img.example/poster.jpg'), 'https://img.example/poster.jpg');
});

test('fetchSeasonDetails calls the TMDB season endpoint', async () => {
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ episodes: [] }) };
  };

  await fetchSeasonDetails(1399, 2, { fetcher });

  assert.equal(urls[0], 'https://api.themoviedb.org/3/tv/1399/season/2?language=en-US');
});
