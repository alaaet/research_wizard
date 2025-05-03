// TypeScript declaration for window.electron
declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

// Utility for IPC communication with Electron main process for research projects
import { ResearchProject } from '../lib/researchProject';

export async function listResearchProjects(): Promise<ResearchProject[]> {
  console.log('[listResearchProjects] Invoking researchProjects:list');
  try {
    const result = await window.electron?.invoke('researchProjects:list');
    console.log('[listResearchProjects] Result:', result);
    return result;
  } catch (err) {
    console.error('[listResearchProjects] Error:', err);
    throw err;
  }
}

export async function createResearchProject(project: ResearchProject): Promise<{ success: boolean }> {
  console.log('[createResearchProject] Invoking researchProjects:create with project:', project);
  try {
    const result = await window.electron?.invoke('researchProjects:create', project);
    console.log('[createResearchProject] Result:', result);
    return result;
  } catch (err) {
    console.error('[createResearchProject] Error:', err);
    throw err;
  }
}

export async function getResearchProject(uid: string): Promise<ResearchProject | null> {
  console.log('[getResearchProject] Invoking researchProjects:get with uid:', uid);
  try {
    const result = await window.electron?.invoke('researchProjects:get', uid);
    console.log('[getResearchProject] Result:', result);
    return result;
  } catch (err) {
    console.error('[getResearchProject] Error:', err);
    throw err;
  }
}

export async function updateResearchProject(project: ResearchProject): Promise<{ success: boolean; error?: string }> {
  console.log('[updateResearchProject] Invoking researchProjects:update with project:', project);
  try {
    const result = await window.electron?.invoke('researchProjects:update', project);
    console.log('[updateResearchProject] Result:', result);
    return result;
  } catch (err) {
    console.error('[updateResearchProject] Error:', err);
    throw err;
  }
}

export {}; 