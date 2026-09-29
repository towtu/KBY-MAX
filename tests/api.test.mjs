import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchAnimeDetails,
  fetchDiscoverMovies,
  fetchDiscoverTV,
  fetchJson,
  fetchPopularAnime,
  fetchSeasonDetails,
  fetchTrendingAnime,
  fetchTrendingMovies,
  fetchTrendingTV,
  getImageUrl,
  searchAnime,
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

test('anime catalog maps AniList cards and sends filtered GraphQL queries', async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({
      data: { Page: { media: [{
        id: 1,
        title: { english: 'Cowboy Bebop' },
        coverImage: { large: 'https://img.example/cover.jpg' },
        averageScore: 82,
        genres: ['Action'],
        episodes: 26,
        startDate: { year: 1998, month: 4, day: 3 }
      }] } }
    }) };
  };

  const trending = await fetchTrendingAnime({ fetcher });
  const popular = await fetchPopularAnime({ fetcher });
  const searched = await searchAnime('Cowboy', { fetcher });

  assert.equal(trending.results[0].media_type, 'anime');
  assert.equal(trending.results[0].poster_path, 'https://img.example/cover.jpg');
  assert.equal(trending.results[0].vote_average, 8.2);
  assert.equal(trending.results[0].first_air_date, '1998-04-03');
  assert.equal(popular.results[0].id, 1);
  assert.equal(searched.results[0].id, 1);
  assert.ok(requests.every(({ url }) => url === 'https://graphql.anilist.co'));
  assert.match(requests[0].body.query, /TRENDING_DESC.*type: ANIME, isAdult: false/s);
  assert.match(requests[1].body.query, /POPULARITY_DESC.*type: ANIME, isAdult: false/s);
  assert.equal(requests[2].body.variables.search, 'Cowboy');
});

test('anime API rejects GraphQL errors and ignores manga recommendations', async () => {
  const errorFetcher = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Rate limited' }] }) });
  await assert.rejects(fetchTrendingAnime({ fetcher: errorFetcher }), /Rate limited/);

  const detailFetcher = async () => ({ ok: true, json: async () => ({ data: { Media: {
    id: 1,
    title: { english: 'Cowboy Bebop' },
    recommendations: { nodes: [
      { mediaRecommendation: { id: 2, type: 'MANGA', title: { english: 'Manga' } } },
      { mediaRecommendation: { id: 3, type: 'ANIME', title: { english: 'Anime' } } }
    ] }
  } } }) });

  const detail = await fetchAnimeDetails(1, { fetcher: detailFetcher });
  assert.deepEqual(detail.recommendations.map((item) => item.id), [3]);
});
