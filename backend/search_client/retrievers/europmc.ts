import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}

export class EuropePMCRetriever extends BaseRetriever {
  static async create() {
    // No API key needed for Europe PMC
    return new EuropePMCRetriever();
  }

  private constructor() {
    super();
  }

  async search({project_title, queries = [], keywords = [], options}: {project_title: string, queries: string[], keywords: string[], options: SearchOptions}): Promise<Resource[]> {
    let results: any[] = [];
    const maxResults = options.maxResults || DEFAULT_OPTIONS.maxResults;
    // Build the search query
    const allQueries = [project_title, ...queries, ...keywords].filter(Boolean);
    if (allQueries.length === 0) {
      return [];
    }
    for (const query of allQueries) {
      try {
        // Europe PMC API: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=...&format=json&pageSize=...
        const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${maxResults}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Warning: Europe PMC API returned status ${response.status} for query "${query}"`);
          continue;
        }
        const data = await response.json();
        const hits = data.resultList?.result || [];
        const mapped = hits.map((hit: any, idx: number) => {
          return {
            uid: hit.id || hit.pmid || hit.pmcid || '',
            title: hit.title || '',
            url: hit.doi ? `https://doi.org/${hit.doi}` : (hit.pmcid ? `https://europepmc.org/articles/${hit.pmcid}` : ''),
            publishedDate: hit.pubYear || '',
            author: hit.authorString || '',
            score: null,
            summary: hit.abstractText || '',
            sourceQuery: query,
            index: idx + 1,
            resource_type: 'paper',
          };
        });
        results.push(...mapped);
      } catch (error) {
        console.warn(`Warning: Error fetching Europe PMC results for query "${query}":`, error);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} Europe PMC search results for query: "${allQueries.join(' | ')}"`);
    return indexedResults;
  }
} 