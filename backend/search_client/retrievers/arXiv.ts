import { BaseRetriever } from "./BaseRetriever";
import { Resource } from '../../../src/lib/Resource';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
};

interface SearchOptions {
  maxResults?: number;
}

function normalizeSummary(summary: any): string {
  if (Array.isArray(summary)) {
    return summary.map((s) =>
      typeof s === 'string' ? s : (s && typeof s === 'object' && '#text' in s ? s['#text'] : '')
    ).join(' ').trim();
  }
  if (summary && typeof summary === 'object' && '#text' in summary) {
    return summary['#text'];
  }
  return typeof summary === 'string' ? summary : '';
}

export class ArxivRetriever extends BaseRetriever {
  static async create() {
    // No API key needed for arXiv
    return new ArxivRetriever();
  }

  private constructor() {
    super();
  }

  async search({project_title, queries = [], keywords = [], options = {}}: {project_title: string, queries: string[], keywords: string[], options: SearchOptions}): Promise<Resource[]> {
    let results: Resource[] = [];
    const maxResults = options.maxResults || DEFAULT_OPTIONS.maxResults;
    const queryParts = [project_title, ...queries, ...keywords].filter(Boolean);
    if (queryParts.length === 0) {
      return [];
    }
    // arXiv API: http://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=1
    const query = encodeURIComponent(queryParts.join(' '));
    const url = `http://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=${maxResults}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }
      const xml = await response.text();
      const parser = new XMLParser();
      const parsed = parser.parse(xml);

      // Atom feed: parsed.feed.entry is an array (or single object if only one result)
      const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
      results = entries.map((entry: any, idx: number) => ({
        uid: entry.id,
        title: entry.title,
        url: entry.id,
        publishedDate: entry.published,
        author: Array.isArray(entry.author)
          ? entry.author.map((a: any) => a.name).join(', ')
          : (entry.author?.name || ''),
        score: undefined,
        summary: normalizeSummary(entry.summary),
        sourceQuery: query,
        index: idx + 1,
        resource_type: 'paper',
      }));
    } catch (error) {
      console.log(`Error fetching arXiv results for query "${query}":`, error);
    }
    // Filter out empty titles
    const indexedResults: Resource[] = results.filter((r) => r.title);
    console.log(`Found ${indexedResults.length} arXiv search results.`);
    return indexedResults;
  }
} 