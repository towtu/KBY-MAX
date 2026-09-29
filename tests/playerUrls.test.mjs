import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPlayerOptions,
  buildZoryvaAnimeUrl,
  buildZoryvaMovieUrl,
  buildZoryvaTvUrl
} from '../src/playerUrls.js';

test('Zoryva movie URL uses its documented resume parameter', () => {
  assert.equal(
    buildZoryvaMovieUrl({ id: 299534, progress: 120 }),
    'https://zoryva.me/embed/movie/299534?color=17c3d1&autoplay=false&startAt=120'
  );
});

test('Zoryva TV and anime URLs use their respective catalog IDs and episode paths', () => {
  assert.equal(
    buildZoryvaTvUrl({ id: 1399, season: 2, episode: 3 }),
    'https://zoryva.me/embed/tv/1399/2/3?color=17c3d1&autoplay=false'
  );
  assert.equal(
    buildZoryvaAnimeUrl({ id: 1, season: 1, episode: 4 }),
    'https://zoryva.me/embed/anime/1/1/4?color=17c3d1&autoplay=false'
  );
});

test('Zoryva URL builder rejects invalid IDs and clamps resume seconds', () => {
  assert.equal(buildZoryvaMovieUrl({ id: 'bad' }), '');
  assert.equal(buildZoryvaAnimeUrl({ id: -1 }), '');
  assert.equal(
    buildZoryvaMovieUrl({ id: 299534, progress: 90000 }),
    'https://zoryva.me/embed/movie/299534?color=17c3d1&autoplay=false&startAt=86400'
  );
});

test('player options contain only Zoryva for anime', () => {
  assert.deepEqual(buildPlayerOptions({ mediaType: 'anime', id: 1, episode: 4 }), [
    {
      id: 'zoryva',
      label: 'Zoryva',
      name: 'Zoryva',
      src: 'https://zoryva.me/embed/anime/1/1/4?color=17c3d1&autoplay=false'
    }
  ]);
});
