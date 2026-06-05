import assert from 'node:assert/strict';
import test from 'node:test';
import { getMovieTitle, getMediaLink } from '../src/movieLinks.js';

test('getMediaLink routes movies and series to their detail pages', () => {
  assert.equal(getMediaLink({ id: 10, title: 'Movie title' }), '/movie/10');
  assert.equal(getMediaLink({ id: 20, name: 'Series title' }), '/tv/20');
  assert.equal(getMediaLink({ id: 30, media_type: 'tv', title: 'Tagged series' }), '/tv/30');
  assert.equal(getMediaLink({ id: 40, media_type: 'anime', title: 'Anime title' }), '/anime/40');
});

test('getMovieTitle supports movie, series, and fallback titles', () => {
  assert.equal(getMovieTitle({ title: 'Movie title' }), 'Movie title');
  assert.equal(getMovieTitle({ name: 'Series title' }), 'Series title');
  assert.equal(getMovieTitle({}), 'Untitled');
});
