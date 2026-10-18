import test from 'node:test';
import assert from 'node:assert/strict';
import { canSyncProduction } from './production-sync.mjs';

test('allows production sync only for the exact pre commit with successful CI', () => {
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: 'abc123', currentPreSha: 'abc123' }), true);
  assert.equal(canSyncProduction({ ciConclusion: 'failure', validatedSha: 'abc123', currentPreSha: 'abc123' }), false);
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: 'abc123', currentPreSha: 'def456' }), false);
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: '', currentPreSha: 'abc123' }), false);
});
