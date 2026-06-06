import assert from 'node:assert/strict';
import test from 'node:test';
import * as playerUrls from '../src/videasy.js';
import {
  buildPlayerOptions,
  buildVidLinkMovieUrl,
  buildVidLinkTvUrl,
  buildVideasyMovieUrl,
  buildVideasyTvUrl
} from '../src/videasy.js';

test('player url module exposes VidLink fallback builders', () => {
  const backupPlayerExports = Object.keys(playerUrls)
    .filter((key) => key.toLowerCase().includes('vidlink'))
    .sort();

  assert.deepEqual(backupPlayerExports, [
    'VIDLINK_BASE_URL',
    'VIDLINK_ICON_COLOR',
    'VIDLINK_SECONDARY_COLOR',
    'buildVidLinkMovieUrl',
    'buildVidLinkTvUrl'
  ]);
});

test('buildVideasyMovieUrl builds a branded movie embed with overlay and progress', () => {
  assert.equal(
    buildVideasyMovieUrl({ id: 299534, progress: 120 }),
    'https://player.videasy.to/movie/299534?color=17c3d1&overlay=true&progress=120'
  );
});

test('buildVideasyTvUrl builds a TV embed with episode controls enabled', () => {
  assert.equal(
    buildVideasyTvUrl({ id: 1399, season: 2, episode: 3 }),
    'https://player.videasy.to/tv/1399/2/3?color=17c3d1&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&overlay=true'
  );
});

test('buildVidLinkMovieUrl builds a backup movie embed with progress', () => {
  assert.equal(
    buildVidLinkMovieUrl({ id: 299534, progress: 120 }),
    'https://vidlink.pro/movie/299534?primaryColor=17c3d1&secondaryColor=101720&iconColor=f8fafc&icons=default&player=default&title=true&poster=true&autoplay=false&startAt=120'
  );
});

test('buildVidLinkTvUrl builds a backup TV embed with episode navigation', () => {
  assert.equal(
    buildVidLinkTvUrl({ id: 1399, season: 2, episode: 3 }),
    'https://vidlink.pro/tv/1399/2/3?primaryColor=17c3d1&secondaryColor=101720&iconColor=f8fafc&icons=default&player=default&title=true&poster=true&autoplay=false&nextbutton=true'
  );
});

test('buildPlayerOptions prefers VidLink and keeps Videasy as a fallback', () => {
  const options = buildPlayerOptions({
    mediaType: 'tv',
    id: 1399,
    season: 2,
    episode: 3,
    progress: 120
  });

  assert.deepEqual(
    options.map(({ id, label, name }) => ({ id, label, name })),
    [
      { id: 'vidlink', label: 'Server 1', name: 'VidLink' },
      { id: 'videasy', label: 'Server 2', name: 'Videasy' }
    ]
  );
  assert.match(options[0].src, /^https:\/\/vidlink\.pro\/tv\/1399\/2\/3\?/);
  assert.match(options[1].src, /^https:\/\/player\.videasy\.to\/tv\/1399\/2\/3\?/);
});
