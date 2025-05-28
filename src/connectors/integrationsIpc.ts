import type { SearchRetriever } from '../../shared/searchRetrieverTypes';

export async function getSearchRetrievers(): Promise<SearchRetriever[]> {
  return await window.electron?.invoke('searchRetrievers:list');
}

export async function updateSearchRetriever(retriever: SearchRetriever): Promise<{ success: boolean; error?: string }> {
  return await window.electron?.invoke('searchRetrievers:update', retriever);
}

export async function searchWithRetriever(retriever: string, project_uid: string, project_title: string, queries: string[], keywords: string[]): Promise<any> {
  return await window.electron?.invoke('searchRetrievers:search', {
    retriever,
    project_uid,
    project_title,
    queries,
    keywords,
  });
} 