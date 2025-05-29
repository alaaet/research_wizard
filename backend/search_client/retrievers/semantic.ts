import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';
import { getRetrieverBySlug } from "../../database";

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}
interface Retriever {
  key_value?: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second

/**
 * Semantic Scholar Retriever
 * See API docs: https://api.semanticscholar.org/api-docs#tag/Paper-Data/operation/get_graph_paper_relevance_search
 */
const API_FIELDS = [
  'title',
  'authors',
  'year',
  'abstract',
  'url',
  'venue',
  'citationCount',
  'referenceCount',
  'fieldsOfStudy',
  'isOpenAccess',
  'journal',
  'paperId',
];

export class SemanticScholarRetriever extends BaseRetriever {
  static async create() {
    const retriever = (await getRetrieverBySlug("semanticscholar")) as Retriever;
    if (!retriever || !retriever.key_value) {
      console.warn("Warning: Semantic Scholar API key not found in database. You may experience 403 or 429 errors.");
      return new SemanticScholarRetriever("");
    }
    console.log("Semantic Scholar API key found in database:", retriever.key_value);
    return new SemanticScholarRetriever(retriever.key_value);
  }

  private apiKey?: string;

  private constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  /**
   * Search Semantic Scholar for papers matching the queries.
   * Enforces 1 request per second to respect API rate limits.
   * Uses exponential backoff and robust retry logic for 429 and network errors.
   */
  async search({ project_title, queries = [], keywords = [], options = {} }: { project_title: string, queries: string[], keywords: string[], options: SearchOptions }): Promise<Resource[]> {
    let results: any[] = [];
    const maxResults: number = typeof options.maxResults === 'number' ? options.maxResults : (typeof DEFAULT_OPTIONS.maxResults === 'number' ? DEFAULT_OPTIONS.maxResults : 10);
    const pageSize = 100; // API max per request

    if (project_title) {
      queries = [project_title, ...queries, ...keywords].filter(Boolean);
    }
    if (queries.length === 0) {
      return [];
    }
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      let totalFetched = 0;
      let more = true;
      let offset = 0;
      while (more && totalFetched < maxResults) {
        let attempt = 0;
        let success = false;
        let lastError: any = null;
        while (attempt < MAX_RETRIES && !success) {
          try {
            const fetchSize = Math.min(pageSize, maxResults - totalFetched);
            const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${fetchSize}&offset=${offset}&fields=${API_FIELDS.join(',')}`;
            const headers: Record<string, string> = {};
            if (this.apiKey && this.apiKey.length > 0) {
              headers['x-api-key'] = this.apiKey;
              console.log("Headers:", headers);
            } else {
              console.warn("Warning: No Semantic Scholar API key provided. Returning empty results.");
            }
            const response = await fetch(url, { headers });
            if (response.status === 429) {
              let delay = BASE_DELAY_MS * Math.pow(2, attempt); // exponential backoff
              const retryAfter = response.headers.get('Retry-After');
              if (retryAfter) {
                const retrySeconds = parseInt(retryAfter, 10);
                if (!isNaN(retrySeconds)) delay = retrySeconds * 1000;
              }
              lastError = new Error(`429 Too Many Requests (rate limit) for query '${query}' [attempt ${attempt + 1}]`);
              console.error(`Semantic Scholar API rate limit hit (429) for query '${query}'. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
              await sleep(delay);
              attempt++;
              continue;
            } else if (response.status === 403) {
              lastError = new Error(`403 Forbidden (API key missing/invalid) for query '${query}' [attempt ${attempt + 1}]`);
              console.error(lastError.message);
              break; // Do not retry on 403
            } else if (!response.ok) {
              lastError = new Error(`Semantic Scholar API error: ${response.status} for query '${query}' [attempt ${attempt + 1}]`);
              console.error(lastError.message);
              // Retry for 5xx errors, not for 4xx (except 429)
              if (response.status >= 500 && response.status < 600) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                attempt++;
                continue;
              } else {
                break;
              }
            } else {
              const data = await response.json();
              if (!data || !Array.isArray(data.data)) {
                lastError = new Error(`Malformed Semantic Scholar API response for query '${query}': ${JSON.stringify(data)}`);
                console.error(lastError.message);
                break;
              }
              results.push(...this.mapPapers(data.data || [], query, totalFetched));
              totalFetched += data.data.length;
              offset += data.data.length;
              more = data.data.length === fetchSize && totalFetched < maxResults;
              success = true;
            }
          } catch (error) {
            lastError = error;
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.error(`Network or fetch error for query '${query}' [attempt ${attempt + 1}]:`, error, `Retrying in ${delay}ms...`);
            await sleep(delay);
            attempt++;
          }
        }
        if (!success && lastError) {
          console.error(`Failed to fetch Semantic Scholar results for query '${query}' after ${MAX_RETRIES} attempts. Last error:`, lastError);
          more = false;
        }
        // Enforce 1 request per second between paginated requests (even if failed)
        if (more) await sleep(1000);
      }
      // Enforce 1 request per second between queries (even if failed)
      if (i < queries.length - 1) {
        await sleep(1000);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} Semantic Scholar search results.`);
    return indexedResults;
  }

  /**
   * Map Semantic Scholar API papers to Resource objects.
   */
  private mapPapers(papers: any[], query: string, offset = 0): Resource[] {
    return papers.map((paper: any, idx: number) => {
      return {
        uid: paper.paperId || '',
        title: paper.title || '',
        url: paper.url || '',
        publishedDate: paper.year ? String(paper.year) : '',
        author: Array.isArray(paper.authors)
          ? paper.authors.map((a: any) => a.name).join(', ')
          : '',
        score: null,
        summary: paper.abstract || paper.venue || '',
        sourceQuery: query,
        index: offset + idx + 1,
        resource_type: 'paper',
        citationCount: paper.citationCount,
        referenceCount: paper.referenceCount,
        fieldsOfStudy: paper.fieldsOfStudy,
        isOpenAccess: paper.isOpenAccess,
        journal: paper.journal?.name || '',
      };
    });
  }
} 