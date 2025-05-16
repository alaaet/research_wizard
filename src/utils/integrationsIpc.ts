import type { SearchRetriever } from '../../shared/searchRetrieverTypes';

export async function getSearchRetrievers(): Promise<SearchRetriever[]> {
  return await window.electron?.invoke('searchRetrievers:list');
}

export async function updateSearchRetriever(retriever: SearchRetriever): Promise<{ success: boolean; error?: string }> {
  return await window.electron?.invoke('searchRetrievers:update', retriever);
}

export async function searchWithRetriever(retriever: SearchRetriever, project_uid: string, queries: string[]): Promise<any> {
  return await window.electron?.invoke('searchRetrievers:search', {
    retriever,
    project_uid,
    queries,
  });
} 