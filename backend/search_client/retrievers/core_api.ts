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

export class CoreAPIRetriever extends BaseRetriever {
  private apiKey: string;

  static async create() {
    const retriever = (await getRetrieverBySlug("coreapi")) as Retriever;
    if (!retriever || !retriever.key_value) {
      console.warn("Warning: CORE API key not found in database.");
      return new CoreAPIRetriever("");
    }
    return new CoreAPIRetriever(retriever.key_value);
  }

  private constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async search({project_title, queries = [], keywords = [], options}: {project_title: string, queries: string[], keywords: string[], options: SearchOptions}): Promise<Resource[]> {
    let results: any[] = [];
    const maxResults = options.maxResults || DEFAULT_OPTIONS.maxResults;
    if (!this.apiKey) {
      console.warn("Warning: No CORE API key provided. Returning empty results.");
      return [];
    }
    // Build the search query
    const allQueries = [project_title, ...queries, ...keywords].filter(Boolean);
    if (allQueries.length === 0) {
      return [];
    }
    for (const query of allQueries) {
      try {
        // CORE API: POST https://api.core.ac.uk/v3/search/works
        const url = "https://api.core.ac.uk/v3/search/works";
        const body = JSON.stringify({ q: query, limit: maxResults });
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body
        });
        if (!response.ok) {
          console.warn(`Warning: CORE API returned status ${response.status} for query "${query}"`);
          continue;
        }
        const data = await response.json();
        const works = data.results || [];
        const mapped = works.map((work: any, idx: number) => {
          return {
            uid: work.id || '',
            title: work.title || '',
            url: work.doi ? `https://doi.org/${work.doi}` : (work.url || ''),
            publishedDate: work.published || '',
            author: Array.isArray(work.authors)
              ? work.authors.map((a: any) => a.name || '').filter(Boolean).join(', ')
              : '',
            score: null,
            summary: work.abstract || '',
            sourceQuery: query,
            index: idx + 1,
            resource_type: 'paper',
          };
        });
        results.push(...mapped);
      } catch (error) {
        console.warn(`Warning: Error fetching CORE API results for query "${query}":`, error);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} CORE API search results for query: "${allQueries.join(' | ')}"`);
    return indexedResults;
  }
} 