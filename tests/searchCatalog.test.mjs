import assert from 'node:assert/strict';
import test from 'node:test';
import { findFuzzyMatches, normalizeSearchText } from '../src/searchCatalog.js';

const catalog = [
  { id: 1, media_type: 'movie', title: 'Spider-Man: Into the Spider-Verse', popularity: 90 },
  { id: 2, media_type: 'tv', name: 'Euphoria', popularity: 80 },
  { id: 3, media_type: 'movie', title: 'The Emperor\'s Shadow', popularity: 40 }
];

test('normalizeSearchText ignores case and punctuation', () => {
  assert.equal(normalizeSearchText(' Spider-Man: INTO the Spider-Verse! '), 'spider man into the spider verse');
});

test('findFuzzyMatches returns close title matches for misspellings', () => {
  const matches = findFuzzyMatches('spidr man', catalog);

  assert.equal(matches[0]?.id, 1);
});

test('findFuzzyMatches still supports normal partial words', () => {
  const matches = findFuzzyMatches('euph', catalog);

  assert.equal(matches[0]?.id, 2);
});

test('findFuzzyMatches ignores tiny title tokens from punctuation', () => {
  const matches = findFuzzyMatches('intersteller', [
    { id: 1, media_type: 'movie', title: 'Interstellar', popularity: 90 },
    { id: 2, media_type: 'movie', title: "Tom Clancy's Jack Ryan: Ghost War", popularity: 80 },
    { id: 3, media_type: 'movie', title: "The Shadow's Edge", popularity: 70 }
  ]);

  assert.deepEqual(matches.map((item) => item.id), [1]);
});
