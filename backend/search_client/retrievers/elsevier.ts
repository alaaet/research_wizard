import { BaseRetriever } from "./BaseRetriever";
import { getRetrieverBySlug } from "../../database";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}
interface Retriever {
  key_value?: string;
}

function parseScienceDirectResults(results: any[], query: string): Resource[] {
  return results.map((item: any, idx: number) => ({
    uid: item.doi || item.pii || item.uri || `sciencedirect-${idx}`,
    title: item.title || '',
    url: item.uri || '',
    summary: '', // ScienceDirect response may not have an abstract/summary
    publishedDate: item.publicationDate || '',
    author: Array.isArray(item.authors) ? item.authors.map((a: any) => a.name).join(', ') : '',
    score: undefined,
    sourceQuery: query,
    index: idx,
    resource_type: 'paper',
  }));
}

function parseScopusEntries(entries: any[], query: string): Resource[] {
  return entries.map((item: any, idx: number) => ({
    uid: item['prism:doi'] || item['eid'] || `scopus-${idx}`,
    title: item['dc:title'] || '',
    url: Array.isArray(item.link) ? (item.link.find((l: any) => l['@ref'] === 'scopus')?.['@href'] || item.link[0]?.['@href'] || '') : '',
    summary: '', // Scopus response may not have an abstract/summary
    publishedDate: item['prism:coverDate'] || '',
    author: item['dc:creator'] || '',
    score: undefined,
    sourceQuery: query,
    index: idx,
    resource_type: 'paper',
  }));
}

export class ElsevierRetriever extends BaseRetriever {
  static async create() {
    const retriever = await getRetrieverBySlug('elsevier') as Retriever;
    console.log('Elsevier retriever config:', retriever);
    const apiKey = retriever?.key_value;
    console.log('Elsevier API key:', apiKey);
    return new ElsevierRetriever(apiKey);
  }

  private apiKey?: string;

  private constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey;
  }

  async search({ project_title, queries = [], keywords = [], options = {} }: {
    project_title: string,
    queries?: string[],
    keywords?: string[],
    options?: SearchOptions
  }): Promise<Resource[]> {
    if (!this.apiKey) {
      console.warn('No Elsevier API key provided.');
      return [];
    }
    const maxResults: number = options?.maxResults ?? DEFAULT_OPTIONS?.maxResults ?? 100;
    // const queryParts = [project_title, ...queries, ...keywords].filter(Boolean);
    const queryParts = keywords.filter(Boolean);
    const query = queryParts.join(' ');
    // Build URLs with apiKey as a query parameter
    const sdUrl = `https://api.elsevier.com/content/search/sciencedirect?query=${encodeURIComponent(query)}&count=${maxResults}&apiKey=${this.apiKey}`;
    const scopusUrl = `https://api.elsevier.com/content/search/scopus?query=${encodeURIComponent(query)}&count=${maxResults}&apiKey=${this.apiKey}`;
    // Fetch both in parallel
    const [sdResp, scopusResp] = await Promise.all([
      fetch(sdUrl, { headers: { 'Accept': 'application/json' } }),
      fetch(scopusUrl, { headers: { 'Accept': 'application/json' } })
    ]);
    let sdResources: Resource[] = [];
    let scopusResources: Resource[] = [];
    if (sdResp.ok) {
      const data = await sdResp.json();
      const results = data.results || [];
      sdResources = parseScienceDirectResults(results, query);
    } else {
      console.warn(`Warning: ScienceDirect API returned status ${sdResp.status} for query "${query}"`);
    }
    if (scopusResp.ok) {
      const data = await scopusResp.json();
      const entries = data['search-results']?.entry || [];
      scopusResources = parseScopusEntries(entries, query);
    } else {
      console.warn(`Warning: Scopus API returned status ${scopusResp.status} for query "${query}"`);
    }
    // Deduplicate by DOI or (title+publishedDate)
    const seen = new Set<string>();
    const merged: Resource[] = [];
    for (const res of [...sdResources, ...scopusResources]) {
      const key = res.uid || (res.title + '|' + res.publishedDate);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(res);
      }
      if (merged.length >= maxResults) break;
    }
    return merged;
  }
} 