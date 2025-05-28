import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}

export class OpenAlexRetriever extends BaseRetriever {
  static async create() {
    // No API key needed for OpenAlex
    return new OpenAlexRetriever();
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
        // OpenAlex API: https://api.openalex.org/works?search=...&per-page=...
        const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${maxResults}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Warning: OpenAlex API returned status ${response.status} for query "${query}"`);
          continue;
        }
        const data = await response.json();
        const works = data.results || [];
        const mapped = works.map((work: any, idx: number) => {
          return {
            uid: work.id || '',
            title: work.title || '',
            url: work.doi ? `https://doi.org/${work.doi}` : (work.id || ''),
            publishedDate: work.publication_date || '',
            author: Array.isArray(work.authorships)
              ? work.authorships.map((a: any) => a.author?.display_name || '').filter(Boolean).join(', ')
              : '',
            score: work.relevance_score || null,
            summary: work.abstract_inverted_index ? Object.keys(work.abstract_inverted_index).join(' ') : '',
            sourceQuery: query,
            index: idx + 1,
            resource_type: 'paper',
          };
        });
        results.push(...mapped);
      } catch (error) {
        console.warn(`Warning: Error fetching OpenAlex results for query "${query}":`, error);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} OpenAlex search results for query: "${allQueries.join(' | ')}"`);
    return indexedResults;
  }
} 