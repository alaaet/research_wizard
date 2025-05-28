import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}

export class DblpRetriever extends BaseRetriever {
  static async create() {
    // No API key needed for DBLP
    return new DblpRetriever();
  }

  private constructor() {
    super();
  }

  async search({project_title, queries = [], keywords = [], options}: {project_title: string, queries: string[], keywords: string[], options: SearchOptions}): Promise<Resource[]> {
    let results: any[] = [];
    const maxResults = options.maxResults || DEFAULT_OPTIONS.maxResults;
    if (project_title) {
      queries = [project_title, ...queries, ...keywords].filter(Boolean);
    }
    if (queries.length === 0) {
      return [];
    }
    for (const query of queries) {
      try {
        const url = `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&format=json&h=${maxResults}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`DBLP API error: ${response.status}`);
        }
        const data = await response.json();
        const hits = data.result?.hits?.hit || [];
        const mapped = hits.map((hit: any, idx: number) => {
          const info = hit.info || {};
          return {
            uid: info.key || '',
            title: info.title || '',
            url: info.url || '',
            publishedDate: info.year || '',
            author: Array.isArray(info.authors?.author)
              ? info.authors.author.map((a: any) => typeof a === 'string' ? a : a.text || '').join(', ')
              : (typeof info.authors?.author === 'string' ? info.authors.author : ''),
            score: hit.score ? Number(hit.score) : null,
            summary: info.venue || '',
            sourceQuery: query,
            index: idx + 1,
            resource_type: 'paper',
          };
        });
        results.push(...mapped);
      } catch (error) {
        console.log(`Error fetching DBLP results for query "${query}":`, error);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} DBLP search results.`);
    return indexedResults;
  }
} 