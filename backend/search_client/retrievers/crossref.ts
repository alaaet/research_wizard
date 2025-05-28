import { BaseRetriever } from "./BaseRetriever";
import { 
  CrossrefClient, 
  WorkSortOptions, 
  Work,
  QueryWorksParams,
  WorkSelectOptions
} from "@jamesgopsill/crossref-client";
import { getRetrieverBySlug } from "../../database";
import { generateUID } from "../../../src/lib/researchProject";
import { Resource } from '../../../src/lib/Resource';

const DEFAULT_OPTIONS: SearchOptions = {
  maxResults: 10,
  sort: "relevance" as WorkSortOptions,
  filter: "type:journal-article",
};

interface Retriever {
  key_value?: string;
}

interface SearchOptions {
  maxResults?: number;
  sort?: WorkSortOptions;
  filter?: string;
}

export class CrossrefRetriever extends BaseRetriever {
  private client: CrossrefClient;

  static async create() {
    const retriever = (await getRetrieverBySlug("crossref")) as Retriever;
    return new CrossrefRetriever(retriever);
  }

  private constructor(retriever: Retriever) {
    super();
    // Initialize client without API key
    this.client = new CrossrefClient();
  }

  async search(project_title: string, queries: string[], options: SearchOptions): Promise<Resource[]> {
    let results: any[] = [];
    console.log(
      `Searching ${options.maxResults || DEFAULT_OPTIONS.maxResults} results per query for:`,
      queries
    );

    if (queries.length === 0) {
      return [];
    }
    if (project_title) {
      queries = [project_title];
    }
    for (const query of queries) {
      try {
        const numResults = options.maxResults || DEFAULT_OPTIONS.maxResults;
        console.log(`Searching for ${numResults} results for query: ${query}`);
        
        // Combine filter with query if provided
        const searchQuery = options.filter ? `${query} ${options.filter}` : query;
        
        const searchParams: QueryWorksParams = {
          queryTitle: searchQuery,
          rows: numResults,
          sort: options.sort || DEFAULT_OPTIONS.sort,
          select: [
            WorkSelectOptions.DOI,
            WorkSelectOptions.TITLE,
            WorkSelectOptions.PUBLISHED,
            WorkSelectOptions.AUTHOR,
            WorkSelectOptions.ABSTRACT
          ]
        };

        const searchResponse = await this.client.works(searchParams);

        if (!searchResponse.ok || searchResponse.status !== 200) {
          throw new Error("Failed to fetch results from Crossref");
        }

        // The items are in response.content.message.items
        const items = searchResponse.content.message.items;
        const resultsWithQuery: Resource[] = items.map((item: Work) => ({
          uid: generateUID(),
          project_uid: "", // This will be set by the index file
          title: item.title?.[0] || "",
          url: item.DOI ? `https://doi.org/${item.DOI}` : "",
          publishedDate: item.published?.dateParts?.[0]?.join("-") || "",
          author: item.author?.map((a) => `${a.given || ""} ${a.family || ""}`.trim()).join(", ") || "",
          score: 1.0, // Crossref doesn't provide relevance scores
          summary: item.abstract || "",
          sourceQuery: query,
          index: 0, // This will be set later
          resource_type: 'paper',
        }));

        results.push(...resultsWithQuery);
      } catch (error) {
        console.log(
          `Error fetching Crossref results for query "${query}":`,
          error
        );
      }
    }

    const indexedResults: Resource[] = results
      ?.filter((result) => result.title)
      ?.map((result, index) => ({ ...result, index: index + 1 }));

    console.log(`Found ${indexedResults.length} search results.`);
    console.info("Indexed search results:", indexedResults);
    return indexedResults;
  }
}
