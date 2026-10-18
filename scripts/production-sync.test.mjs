import test from 'node:test';
import assert from 'node:assert/strict';
import { canSyncProduction, isNewerWorkflowRun } from './production-sync.mjs';

test('allows production sync only for the exact pre commit with successful CI', () => {
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: 'abc123', currentPreSha: 'abc123' }), true);
  assert.equal(canSyncProduction({ ciConclusion: 'failure', validatedSha: 'abc123', currentPreSha: 'abc123' }), false);
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: 'abc123', currentPreSha: 'def456' }), false);
  assert.equal(canSyncProduction({ ciConclusion: 'success', validatedSha: '', currentPreSha: 'abc123' }), false);
});

test('distinguishes CI runs triggered after dispatch without relying on timestamp precision', () => {
  assert.equal(isNewerWorkflowRun({ runId: 401, previousRunId: 400 }), true);
  assert.equal(isNewerWorkflowRun({ runId: 400, previousRunId: 400 }), false);
  assert.equal(isNewerWorkflowRun({ runId: 399, previousRunId: 400 }), false);
  assert.equal(isNewerWorkflowRun({ runId: undefined, previousRunId: 400 }), false);
});
