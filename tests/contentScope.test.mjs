import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import test from 'node:test';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const deniedTerms = [
  ['a', 'n', 'i', 'm', 'e'].join(''),
  ['a', 'n', 'i', 'l', 'i', 's', 't'].join(''),
  ['m', 'y', 'a', 'n', 'i', 'm', 'e', 'l', 'i', 's', 't'].join('')
];
const ignoredDirs = new Set([
  '.agents',
  '.codex',
  '.git',
  '.playwright-cli',
  '.superpowers',
  'dist',
  'node_modules',
  'output'
]);
const collectFiles = (dir) => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const relativePath = relative(rootDir, path);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return ignoredDirs.has(entry) ? [] : collectFiles(path);
    }

    if (!stats.isFile()) return [];
    return [path];
  });
};

test('app-owned files do not mention retired category providers', () => {
  const matches = collectFiles(rootDir).flatMap((path) => {
    const relativePath = relative(rootDir, path);
    const content = readFileSync(path, 'utf8').toLowerCase();

    return deniedTerms
      .filter((term) => content.includes(term))
      .map((term) => `${relativePath}: ${term}`);
  });

  assert.deepEqual(matches, []);
});
