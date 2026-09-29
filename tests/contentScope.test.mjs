import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import test from 'node:test';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const deniedTerms = ['vidlink', 'videasy'];
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

test('app source does not reference retired player providers', () => {
  const matches = collectFiles(join(rootDir, 'src')).flatMap((path) => {
    const relativePath = relative(rootDir, path);
    const content = readFileSync(path, 'utf8').toLowerCase();

    return deniedTerms
      .filter((term) => content.includes(term))
      .map((term) => `${relativePath}: ${term}`);
  });

  assert.deepEqual(matches, []);
});
