import { ResearchDraft } from '../lib/researchDraft';

export async function listResearchDrafts(projectId: string): Promise<ResearchDraft[]> {
  return await window.electron.invoke('researchDrafts:list', { projectId });
}

export async function addResearchDraftToProject(draft: ResearchDraft) {
  return await window.electron.invoke('researchDrafts:add', draft);
}

export async function updateResearchDraft(draft: ResearchDraft) {
  return await window.electron.invoke('researchDrafts:update', draft);
}
export async function updateResearchDraftReport(draft: { uid: string, report: string }) {
  return await window.electron.invoke('researchDrafts:updateReport', draft);
}

export async function getResearchDrafts(projectId: string): Promise<ResearchDraft[]> {
  return await window.electron.invoke('researchDrafts:get', { projectId });
}

export async function getResearchDraft(draftId: string): Promise<ResearchDraft> {
  return await window.electron.invoke('researchDrafts:getDraft', { draftId });
}

export async function generateResearchDraftOutline(topic: string, language: string) {
  return await window.electron.invoke('researchDrafts:generateOutline', { topic, language });
}

export async function generateSubsectionContent(projectId: string, topic: string, sectionTitle: string, subsectionTitle: string, language: string) {
  return await window.electron.invoke('researchDrafts:generateSubsectionContent', { projectId, topic, sectionTitle, subsectionTitle, language });
}

export async function deleteResearchDraft(draftId: string) {
  return await window.electron.invoke('researchDrafts:delete', { draftId });
}

export async function exportDraftReport(uid: string, format: 'md' | 'docs' | 'pdf') {
  return await window.electron.invoke('researchDrafts:exportReport', { uid, format });
}