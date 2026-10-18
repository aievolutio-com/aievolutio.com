import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decideBranchCleanup,
  getCommitAgeDays,
  hasMergedPullRequestHead,
  summarizeTagRefs,
} from './github-housekeeping.mjs';

const eligibleBranch = {
  branchName: 'feat/example',
  defaultBranch: 'main',
  ageDays: 8,
  hasOpenPullRequest: false,
  hasActiveWorkflow: false,
  mergedIntoPre: true,
  isProtected: false,
};

test('retains base branches even when old and merged', () => {
  for (const branchName of ['main', 'pre', 'gh-pages']) {
    assert.equal(decideBranchCleanup({ ...eligibleBranch, branchName }).action, 'retain');
  }
  assert.equal(decideBranchCleanup({ ...eligibleBranch, branchName: 'custom-default', defaultBranch: 'custom-default' }).action, 'retain');
  assert.equal(decideBranchCleanup({ ...eligibleBranch, isProtected: true }).action, 'retain');
});

test('deletes only branches older than seven days that are fully integrated and inactive', () => {
  assert.equal(decideBranchCleanup(eligibleBranch).action, 'delete');
  assert.equal(decideBranchCleanup({ ...eligibleBranch, ageDays: 6 }).action, 'retain');
  assert.equal(decideBranchCleanup({ ...eligibleBranch, hasOpenPullRequest: true }).action, 'retain');
  assert.equal(decideBranchCleanup({ ...eligibleBranch, hasActiveWorkflow: true }).action, 'retain');
});

test('never auto-deletes unmerged work and flags it for review after 30 days', () => {
  assert.equal(decideBranchCleanup({ ...eligibleBranch, mergedIntoPre: false }).action, 'retain');
  assert.equal(decideBranchCleanup({ ...eligibleBranch, ageDays: 30, mergedIntoPre: false }).action, 'review');
  const result = decideBranchCleanup({ ...eligibleBranch, ageDays: 31, mergedIntoPre: false });
  assert.equal(result.action, 'review');
  assert.match(result.reason, /requiere revisión/);
});

test('retains branches when the API omits commit timestamps', () => {
  assert.equal(getCommitAgeDays({}, Date.UTC(2026, 0, 10)), null);
  assert.equal(getCommitAgeDays({ sha: 'abc123' }, Date.UTC(2026, 0, 10)), null);
  assert.equal(getCommitAgeDays({ commit: { author: { date: 'invalid' } } }), null);

  const result = decideBranchCleanup({ ...eligibleBranch, ageDays: null });
  assert.equal(result.action, 'retain');
  assert.match(result.reason, /antigüedad del commit/);
});

test('calculates branch age from commit metadata', () => {
  const now = Date.UTC(2026, 0, 10);
  assert.equal(
    getCommitAgeDays({ commit: { committer: { date: '2026-01-01T00:00:00.000Z' } } }, now),
    9,
  );
});

test('recognizes an exact branch head merged into pre by squash', () => {
  const mergedPullRequest = {
    base: { ref: 'pre' },
    head: { ref: 'chore/fix-ci-deps', sha: 'merged-head' },
    merged_at: '2025-09-05T14:05:07Z',
  };
  const branch = { branchName: 'chore/fix-ci-deps', branchSha: 'merged-head' };

  assert.equal(hasMergedPullRequestHead([mergedPullRequest], branch), true);
  assert.equal(
    hasMergedPullRequestHead([mergedPullRequest], { ...branch, branchSha: 'newer-unmerged-head' }),
    false,
  );
  assert.equal(
    hasMergedPullRequestHead([{ ...mergedPullRequest, base: { ref: 'main' } }], branch),
    false,
  );
  assert.equal(
    hasMergedPullRequestHead([{ ...mergedPullRequest, merged_at: null }], branch),
    false,
  );
});

test('reports tag names while counting malformed references', () => {
  assert.deepEqual(
    summarizeTagRefs([
      { ref: 'refs/tags/v0.1.0' },
      {},
      { ref: 'refs/heads/pre' },
      { ref: 'refs/tags/' },
    ]),
    { names: ['v0.1.0'], malformedCount: 3 },
  );
});
