export async function saveLiteratureResults(projectId: string, results: any[]) {
  return await window.electron?.invoke('literature:saveResults', {
    projectId,
    results,
  });
}

export async function getLiteratureResults(projectId: string) {
  return await window.electron?.invoke('literature:getResults', { projectId });
} 