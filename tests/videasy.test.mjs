import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildVidLinkAnimeUrl,
  buildVidLinkMovieUrl,
  buildVidLinkTvUrl,
  buildVideasyAnimeUrl,
  buildVideasyMovieUrl,
  buildVideasyTvUrl
} from '../src/videasy.js';

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
    'https://player.videasy.net/anime/21/1?color=17c3d1&episodeSelector=true&overlay=true'
  );
  assert.equal(
    buildVideasyAnimeUrl({ id: 145139 }),
    'https://player.videasy.net/anime/145139?color=17c3d1&overlay=true'
  );
});

test('buildVidLinkTvUrl builds a backup TV embed with custom colors', () => {
  assert.equal(
    buildVidLinkTvUrl({ id: 94997, season: 1, episode: 2, progress: 60 }),
    'https://vidlink.pro/tv/94997/1/2?primaryColor=17c3d1&secondaryColor=101720&iconColor=f8fafc&icons=default&player=default&title=true&poster=true&autoplay=false&nextbutton=true&startAt=60'
  );
});

test('buildVidLinkAnimeUrl uses MyAnimeList id and fallback sub/dub support', () => {
  assert.equal(
    buildVidLinkAnimeUrl({ malId: 21, episode: 4 }),
    'https://vidlink.pro/anime/21/4/sub?fallback=true&primaryColor=17c3d1&secondaryColor=101720&iconColor=f8fafc&icons=default&player=default&title=true&poster=true&autoplay=false&nextbutton=true'
  );
});

test('buildVidLinkMovieUrl builds a backup movie embed', () => {
  assert.equal(
    buildVidLinkMovieUrl({ id: 786892 }),
    'https://vidlink.pro/movie/786892?primaryColor=17c3d1&secondaryColor=101720&iconColor=f8fafc&icons=default&player=default&title=true&poster=true&autoplay=false'
  );
});
