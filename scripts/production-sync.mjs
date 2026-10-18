export function canSyncProduction({ ciConclusion, validatedSha, currentPreSha }) {
  return ciConclusion === 'success' && Boolean(validatedSha) && validatedSha === currentPreSha;
}
