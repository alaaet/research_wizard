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

export class NcbiNihRetriever extends BaseRetriever {
  private apiKey?: string;

  static async create() {
    const retriever = await getRetrieverBySlug('ncbi_nih') as Retriever;
    const apiKey = retriever?.key_value;
    return new NcbiNihRetriever(apiKey);
  }

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
    const maxResults: number = (options && typeof options.maxResults === 'number') ? options.maxResults : DEFAULT_OPTIONS.maxResults!;
    const queryParts = [project_title, ...queries, ...keywords].filter(Boolean);
    const query = encodeURIComponent(queryParts.join(' '));
    const apiKeyParam = this.apiKey ? `&api_key=${this.apiKey}` : '';
    // Step 1: ESearch to get UIDs
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=${maxResults}&retmode=json${apiKeyParam}`;
    const esearchResp = await fetch(esearchUrl);
    if (!esearchResp.ok) {
      console.warn(`Warning: NCBI ESearch returned status ${esearchResp.status} for query "${query}"`);
      return [];
    }
    const esearchData = await esearchResp.json();
    const idList = esearchData.esearchresult?.idlist || [];
    if (idList.length === 0) return [];
    // Step 2: ESummary to get details
    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json${apiKeyParam}`;
    const esummaryResp = await fetch(esummaryUrl);
    if (!esummaryResp.ok) {
      console.warn(`Warning: NCBI ESummary returned status ${esummaryResp.status} for ids "${idList.join(',')}"`);
      return [];
    }
    const esummaryData = await esummaryResp.json();
    const docs = esummaryData.result || {};
    const resources: Resource[] = [];
    for (const uid of idList) {
      const doc = docs[uid];
      if (!doc) continue;
      resources.push({
        uid,
        title: doc.title || '',
        url: doc.elocationid ? `https://pubmed.ncbi.nlm.nih.gov/${uid}/` : '',
        summary: doc.summary || doc.title || '',
        publishedDate: doc.pubdate || '',
        author: Array.isArray(doc.authors) ? doc.authors.map((a: any) => a.name).join(', ') : '',
        score: undefined,
        sourceQuery: query,
        index: undefined,
        resource_type: 'paper',
      });
    }
    return resources;
  }
} 