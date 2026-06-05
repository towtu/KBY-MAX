import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const indexCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const detailCss = readFileSync(new URL('../src/pages/MovieDetail.css', import.meta.url), 'utf8');
const detailJsx = readFileSync(new URL('../src/pages/MovieDetail.jsx', import.meta.url), 'utf8');
const homeCss = readFileSync(new URL('../src/pages/Home.css', import.meta.url), 'utf8');

test('global scrollbar colors are customized for Firefox and WebKit', () => {
  assert.match(indexCss, /--scrollbar-track:/);
  assert.match(indexCss, /--scrollbar-thumb:/);
  assert.match(indexCss, /scrollbar-color:\s*var\(--scrollbar-thumb\)\s+var\(--scrollbar-track\)/);
  assert.match(indexCss, /::-webkit-scrollbar-thumb/);
});

test('horizontal media rails use custom scrollbars instead of browser defaults', () => {
  assert.match(detailCss, /\.episode-strip::-webkit-scrollbar/);
  assert.match(detailCss, /\.cast-list::-webkit-scrollbar/);
  assert.match(detailCss, /scrollbar-color:\s*var\(--scrollbar-thumb\)\s+var\(--scrollbar-rail\)/);
});

test('home and detail layouts include TV-sized responsive rules', () => {
  assert.match(indexCss, /@media \(min-width:\s*1800px\)/);
  assert.match(homeCss, /@media \(min-width:\s*1800px\)/);
  assert.match(detailCss, /@media \(min-width:\s*1800px\)/);
  assert.match(detailCss, /@media \(min-width:\s*2400px\)/);
});

test('episode rails expose remote-friendly scroll controls', () => {
  assert.match(detailJsx, /episode-rail-shell/);
  assert.match(detailJsx, /episode-rail-control left/);
  assert.match(detailJsx, /episode-rail-control right/);
  assert.match(detailJsx, /scrollEpisodeRail/);
  assert.match(detailCss, /\.episode-rail-control/);
  assert.match(detailCss, /\.episode-rail-control::before/);
  assert.match(detailCss, /\.episode-rail-control svg/);
  assert.match(detailCss, /border-radius:\s*999px/);
  assert.match(detailCss, /\.episode-rail-control:focus-visible/);
});
