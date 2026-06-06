import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const detailPath = fileURLToPath(new URL('../src/pages/MovieDetail.jsx', import.meta.url));
const detailSource = readFileSync(detailPath, 'utf8');

test('movie detail uses the shared multi-server player options', () => {
  assert.match(detailSource, /buildPlayerOptions/);
  assert.match(detailSource, /If playback keeps loading, try the other server\./);
  assert.doesNotMatch(
    detailSource,
    /\{\s*id:\s*['"]videasy['"],\s*label:\s*['"]Server 1['"]/
  );
});
