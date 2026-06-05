import assert from 'node:assert/strict';
import test from 'node:test';
import { getAnimePlayerEpisode, getDisplayYear, getRuntimeLabel, getScoreLabel } from '../src/movieDetailMeta.js';

test('getDisplayYear reads movie and tv dates', () => {
  assert.equal(getDisplayYear({ release_date: '2026-01-10' }), '2026');
  assert.equal(getDisplayYear({ first_air_date: '2025-03-04' }), '2025');
  assert.equal(getDisplayYear({}), '');
});

test('getRuntimeLabel reads movie runtime and tv episode runtime', () => {
  assert.equal(getRuntimeLabel({ runtime: 122 }), '122 min');
  assert.equal(getRuntimeLabel({ episode_run_time: [48] }), '48 min episodes');
  assert.equal(getRuntimeLabel({}), '');
});

test('getScoreLabel formats vote average as a score', () => {
  assert.equal(getScoreLabel({ vote_average: 8.54 }), 'Score 8.5');
  assert.equal(getScoreLabel({ vote_average: 5.79 }), 'Score 5.8');
  assert.equal(getScoreLabel({ vote_average: 0 }), 'Not rated');
});

test('getAnimePlayerEpisode keeps anime shows on episode routes', () => {
  assert.equal(getAnimePlayerEpisode({ format: 'TV', selectedEpisode: 1 }), 1);
  assert.equal(getAnimePlayerEpisode({ format: 'OVA', selectedEpisode: 1 }), 1);
  assert.equal(getAnimePlayerEpisode({ format: 'MOVIE', selectedEpisode: 1 }), undefined);
});
