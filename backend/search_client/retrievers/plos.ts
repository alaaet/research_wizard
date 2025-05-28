import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}

export class PlosRetriever extends BaseRetriever {
  static async create() {
    // No API key needed for PLOS
    return new PlosRetriever();
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
        // PLOS API: https://api.plos.org/search?q=...&fl=...&wt=json&rows=...
        const fields = [
          'id',
          'title',
          'author_display',
          'abstract',
          'publication_date',
          'journal',
          'score'
        ];
        const url = `https://api.plos.org/search?q=${encodeURIComponent(query)}&fl=${fields.join(',')}&wt=json&rows=${maxResults}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Warning: PLOS API returned status ${response.status} for query "${query}"`);
          continue;
        }
        const data = await response.json();
        const docs = data.response?.docs || [];
        const mapped = docs.map((doc: any, idx: number) => {
          return {
            uid: doc.id || '',
            title: Array.isArray(doc.title) ? doc.title[0] : doc.title || '',
            url: doc.id ? `https://doi.org/${doc.id}` : '',
            publishedDate: doc.publication_date ? doc.publication_date.split('T')[0] : '',
            author: Array.isArray(doc.author_display) ? doc.author_display.join(', ') : (doc.author_display || ''),
            score: doc.score || null,
            summary: doc.abstract || '',
            sourceQuery: query,
            index: idx + 1,
            resource_type: 'paper',
          };
        });
        results.push(...mapped);
      } catch (error) {
        console.log(`Error fetching PLOS results for query "${query}":`, error);
      }
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} PLOS search results for query: "${allQueries.join(' | ')}"`);
    return indexedResults;
  }
} 