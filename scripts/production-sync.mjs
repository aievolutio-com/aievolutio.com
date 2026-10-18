export function canSyncProduction({ ciConclusion, validatedSha, currentPreSha }) {
  return ciConclusion === 'success' && Boolean(validatedSha) && validatedSha === currentPreSha;
}

export function isNewerWorkflowRun({ runId, previousRunId }) {
  return Number.isSafeInteger(runId) && Number.isSafeInteger(previousRunId) && runId > previousRunId;
}
