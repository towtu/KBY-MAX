import assert from 'node:assert/strict';
import test from 'node:test';
import { getResumeItems, mapResumeItemsForCards, saveResumeItem } from '../src/localResume.js';

const createStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
};

test('getResumeItems returns an empty list when localStorage has no history', () => {
  assert.deepEqual(getResumeItems(createStorage()), []);
});

test('saveResumeItem stores progress items sorted by most recent update', () => {
  const storage = createStorage();

  saveResumeItem({
    id: 1,
    mediaType: 'movie',
    title: 'Older',
    posterPath: '/old.jpg',
    progress: 120,
    updatedAt: 10
  }, storage);
  saveResumeItem({
    id: 2,
    mediaType: 'tv',
    title: 'Newer',
    posterPath: '/new.jpg',
    progress: 300,
    updatedAt: 20
  }, storage);

  assert.deepEqual(getResumeItems(storage).map((item) => item.id), [2, 1]);
});

test('saveResumeItem keeps anime as its own media type', () => {
  const storage = createStorage();

  const items = saveResumeItem({
    id: 21,
    mediaType: 'anime',
    title: 'One Piece',
    posterPath: '/one-piece.jpg',
    progress: 95,
    updatedAt: 100
  }, storage);

  assert.equal(items[0].mediaType, 'anime');
});

test('saveResumeItem ignores entries without progress', () => {
  const storage = createStorage();

  saveResumeItem({
    id: 1,
    mediaType: 'movie',
    title: 'Not Started',
    posterPath: '/poster.jpg',
    progress: 0,
    updatedAt: 10
  }, storage);

  assert.deepEqual(getResumeItems(storage), []);
});

test('mapResumeItemsForCards converts local progress items into MovieCard data', () => {
  assert.deepEqual(
    mapResumeItemsForCards([
      {
        id: 21,
        mediaType: 'anime',
        title: 'One Piece',
        posterPath: 'https://img.example/poster.jpg',
        backdropPath: 'https://img.example/backdrop.jpg'
      }
    ]),
    [
      {
        id: 21,
        media_type: 'anime',
        mediaType: 'anime',
        title: 'One Piece',
        name: 'One Piece',
        poster_path: 'https://img.example/poster.jpg',
        backdrop_path: 'https://img.example/backdrop.jpg'
      }
    ]
  );
});
