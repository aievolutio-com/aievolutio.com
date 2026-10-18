const permanentlyRetainedBranches = new Set(['gh-pages', 'main', 'pre']);

export function decideBranchCleanup({
  branchName,
  defaultBranch,
  ageDays,
  hasOpenPullRequest,
  hasActiveWorkflow,
  mergedIntoPre,
  isProtected,
}) {
  if (permanentlyRetainedBranches.has(branchName) || branchName === defaultBranch || isProtected) {
    return { action: 'retain', reason: 'Rama base, predeterminada o protegida.' };
  }
  if (hasOpenPullRequest) {
    return { action: 'retain', reason: 'Tiene un pull request abierto.' };
  }
  if (hasActiveWorkflow) {
    return { action: 'retain', reason: 'Tiene una ejecución activa.' };
  }
  if (ageDays < 7) {
    return { action: 'retain', reason: 'La rama tiene menos de siete días.' };
  }
  if (mergedIntoPre) {
    return { action: 'delete', reason: 'Su commit ya está integrado en pre.' };
  }
  if (ageDays >= 30) {
    return { action: 'review', reason: 'Tiene más de 30 días y cambios no integrados; requiere revisión.' };
  }
  return { action: 'retain', reason: 'Tiene cambios no integrados y aún está dentro del periodo de conservación.' };
}
