import assert from 'node:assert/strict';
import test from 'node:test';
import { NAV_LINKS } from '../src/navLinks.js';

test('primary nav links point to real browse destinations', () => {
  assert.deepEqual(NAV_LINKS, [
    { label: 'Home', path: '/' },
    { label: 'TV Shows', path: '/browse/tv-shows' },
    { label: 'Movies', path: '/browse/movies' },
    { label: 'New & Popular', path: '/browse/top-ten' },
    { label: 'My List', path: '/browse/my-list' }
  ]);
});
