import assert from 'node:assert/strict';
import test from 'node:test';
import * as playerUrls from '../src/videasy.js';
import {
  buildVideasyAnimeUrl,
  buildVideasyMovieUrl,
  buildVideasyTvUrl
} from '../src/videasy.js';

test('player url module only exposes Videasy builders', () => {
  const backupPlayerExports = Object.keys(playerUrls).filter((key) => key.toLowerCase().includes('vidlink'));

  assert.deepEqual(backupPlayerExports, []);
});

test('buildVideasyMovieUrl builds a branded movie embed with overlay and progress', () => {
  assert.equal(
    buildVideasyMovieUrl({ id: 299534, progress: 120 }),
    'https://player.videasy.net/movie/299534?color=17c3d1&overlay=true&progress=120'
  );
});

test('buildVideasyTvUrl builds a TV embed with episode controls enabled', () => {
  assert.equal(
    buildVideasyTvUrl({ id: 1399, season: 2, episode: 3 }),
    'https://player.videasy.net/tv/1399/2/3?color=17c3d1&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&overlay=true'
  );
});

test('buildVideasyAnimeUrl supports anime shows and anime movies', () => {
  assert.equal(
    buildVideasyAnimeUrl({ id: 21, episode: 1 }),
    'https://player.videasy.net/anime/21/1?color=17c3d1&episodeSelector=true&overlay=true&category=sub'
  );
  assert.equal(
    buildVideasyAnimeUrl({ id: 145139 }),
    'https://player.videasy.net/anime/145139?color=17c3d1&overlay=true'
  );
});
