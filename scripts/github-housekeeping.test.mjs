import test from 'node:test';
import assert from 'node:assert/strict';
import { decideBranchCleanup } from './github-housekeeping.mjs';

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
