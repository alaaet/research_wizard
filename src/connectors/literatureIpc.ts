export async function saveLiteratureResults(projectId: string, results: any[]) {
  return await window.electron?.invoke('literature:saveResults', {
    projectId,
    results,
  });
}

export async function getLiteratureResults(projectId: string) {
  return await window.electron?.invoke('literature:getResults', { projectId });
}

export async function exportLiterature(format: string, papers: any[]) {
  return await window.electron?.invoke('literature:export', { format, papers });
} 

export async function addPaper(projectId: string, paper: any) {
  return await window.electron?.invoke('literature:addPaper', {
    projectId,
    paper,
  });
}

export async function updatePaper(paper: any) {
  return await window.electron?.invoke('literature:updatePaper', {
    paper,
  });
}

export async function deletePaper(paperId: string) {
  return await window.electron?.invoke('literature:deletePaper', {
    paperId,
  });
}
