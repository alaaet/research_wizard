// TypeScript declaration for window.electron
declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

import { Resource } from '../lib/Resource'; // Resource is used as the type for resources

// --- Resource IPC Connectors ---

/**
 * Shows an open file dialog to select local files.
 * @returns A promise that resolves to an array of file paths or undefined if canceled.
 */
export async function showOpenFileDialog(): Promise<string[] | undefined> {
  try {
    const result = await window.electron?.invoke('resources:showOpenDialog');
    console.log('[showOpenFileDialog] Result:', result);
    return result;
  } catch (err) {
    console.error('[showOpenFileDialog] Error:', err);
    throw err;
  }
}

/**
 * Adds a new resource (URL or local file) to a project.
 * @param projectId The UID of the project.
 * @param resourceData Data for the new resource (Resource shape, urlOrPath allowed for backward compatibility).
 * @returns A promise that resolves to an object with success status, UID of the new resource, and optional error.
 */
export async function addResource(
  projectId: string,
  resourceData: Omit<Resource, 'uid' | 'project_uid'> & { urlOrPath?: string }
): Promise<{ success: boolean; uid?: string; error?: string }> {
  // Map urlOrPath to url if present
  const dataToSend: any = { ...resourceData };
  if (dataToSend.urlOrPath && !dataToSend.url) {
    dataToSend.url = dataToSend.urlOrPath;
  }
  delete dataToSend.urlOrPath;

  // Ensure publishedDate is ISO string if it's a Date object
  if (dataToSend.publishedDate instanceof Date && !isNaN(dataToSend.publishedDate.getTime())) {
    dataToSend.publishedDate = dataToSend.publishedDate.toISOString();
  } else if (!dataToSend.publishedDate) {
    dataToSend.publishedDate = null; // or undefined, depending on your backend
  }

  console.log('[addResource] Invoking resources:add with projectId:', projectId, 'resourceData:', dataToSend);
  try {
    const result = await window.electron?.invoke('resources:add', projectId, dataToSend);
    console.log('[addResource] Result:', result);
    return result;
  } catch (err) {
    console.error('[addResource] Error:', err);
    throw err;
  }
}

/**
 * Lists all resources for a given project.
 * @param projectId The UID of the project.
 * @returns A promise that resolves to an array of resources (research_paper objects).
 */
export async function listResources(projectId: string): Promise<Resource[]> {
  console.log('[listResources] Invoking resources:list with projectId:', projectId);
  try {
    const result = await window.electron?.invoke('resources:list', projectId);
    console.log('[listResources] Result:', result);
    // Ensure publishedDate is a string (ISO format) or null
    return result.map((res: Resource) => ({
      ...res,
      publishedDate: res.publishedDate ? new Date(res.publishedDate).toISOString() : null,
    }));
  } catch (err) {
    console.error('[listResources] Error:', err);
    throw err;
  }
}

/**
 * Updates an existing resource.
 * @param resourceData The full resource object with updated fields. UID must be present.
 * @returns A promise that resolves to an object with success status and optional error.
 */
export async function updateResource(
  resourceData: Resource
): Promise<{ success: boolean; error?: string }> {
  console.log('[updateResource] Invoking resources:update with resourceData:', resourceData);
  try {
    // Ensure publishedDate is ISO string if it's a Date object
    if (resourceData.publishedDate && typeof resourceData.publishedDate !== 'string') {
        resourceData.publishedDate = new Date(resourceData.publishedDate).toISOString();
    }
    const result = await window.electron?.invoke('resources:update', resourceData);
    console.log('[updateResource] Result:', result);
    return result;
  } catch (err) {
    console.error('[updateResource] Error:', err);
    throw err;
  }
}

/**
 * Deletes a resource.
 * @param resourceId The UID of the resource to delete.
 * @returns A promise that resolves to an object with success status and optional error.
 */
export async function deleteResource(resourceId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[deleteResource] Invoking resources:delete with resourceId:', resourceId);
  try {
    const result = await window.electron?.invoke('resources:delete', resourceId);
    console.log('[deleteResource] Result:', result);
    return result;
  } catch (err) {
    console.error('[deleteResource] Error:', err);
    throw err;
  }
}

// Legacy functions (to be removed or refactored if still used by other parts of UI not yet updated)
// For now, these can be kept to avoid breaking other parts of the app immediately,
// but they should point to the new resource handlers if their functionality overlaps
// or be removed if they are fully superseded.

export async function saveLiteratureResults(projectId: string, results: Resource[]) {
  console.warn('[saveLiteratureResults] Legacy function called. Consider migrating to addResource for individual items.');
  // This function was for bulk adding, which addResource doesn't directly replace.
  // For now, it might still call an old IPC handler or be refactored.
  // Let's assume it still uses the old 'literature:saveResults' for now if it has specific bulk logic.
  try {
    const result = await window.electron?.invoke('literature:saveResults', { projectId, results });
    console.log('[saveLiteratureResults] Result:', result);
    return result;
  } catch (err) {
    console.error('[saveLiteratureResults] Error:', err);
    throw err;
  }
}

export async function exportLiterature(format: string, resources: Resource[]) {
   console.warn('[exportLiterature] Legacy function called.');
  // This function is specific to "papers" and export format.
  // It might remain as is or be adapted for resources if applicable.
  try {
    const result = await window.electron?.invoke('literature:export', { format, resources });
    console.log('[exportLiterature] Result:', result);
    return result;
  } catch (err) {
    console.error('[exportLiterature] Error:', err);
    throw err;
  }
}

/**
 * Extracts Resource metadata from a PDF file.
 */
export async function extractResourceFromPDF(filePath: string): Promise<Resource> {
  return await window.electron?.invoke('resources:extractFromPDF', filePath);
}

/**
 * Extracts Resource metadata from a DOCX file.
 */
export async function extractResourceFromDocx(filePath: string): Promise<Resource> {
  return await window.electron?.invoke('resources:extractFromDocx', filePath);
}

/**
 * Extracts Resource metadata from a TXT file.
 */
export async function extractResourceFromTxt(filePath: string): Promise<Resource> {
  return await window.electron?.invoke('resources:extractFromTxt', filePath);
}

/**
 * Extracts Resource metadata from a URL.
 */
export async function extractResourceFromUrl(url: string): Promise<Resource> {
  return await window.electron?.invoke('resources:extractFromUrl', url);
}
