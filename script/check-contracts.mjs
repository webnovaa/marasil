import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const canonical = JSON.parse(readFileSync(new URL('../packages/contracts/openapi.json', import.meta.url), 'utf8'));
const mirror = JSON.parse(readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'));
assert.deepEqual(mirror, canonical, 'docs/openapi.yaml must mirror packages/contracts/openapi.json');
const documented = Object.entries(canonical.paths).flatMap(([path, operations]) => Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`)).sort();
if (process.argv.includes('--routes')) {
  const routes = JSON.parse(readFileSync(0, 'utf8'));
  const actual = routes.filter((route) => route.uri.startsWith('api/')).flatMap((route) => route.method.split('|').filter((method) => method !== 'HEAD').map((method) => `${method} /${route.uri}`)).sort();
  assert.deepEqual(documented, actual, 'OpenAPI operations must match registered Laravel API routes');
}
console.log(`Contracts match: ${documented.length} API operations.`);
