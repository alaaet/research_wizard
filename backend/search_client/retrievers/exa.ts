import { BaseRetriever } from "./BaseRetriever";
import Exa from "exa-js";
import { getRetrieverBySlug } from "../../database";

/* 
DEFAULT OPTIONS FOR EXA SEARCH  
*/
const DEFAULT_OPTIONS: SearchOptions = {
  linksPerQuery: 10,
  useAutoprompt: false,
  type: "neural",
  category: "research paper",
};

interface Retriever {
  key_value: string;
}

interface SearchOptions {
  linksPerQuery?: number;
  useAutoprompt?: boolean;
  type?: string;
  category?: string;
}

interface research_paper {
    id: string;
    title: string;
    url: string;
    publishedDate: string;
    author: string;
    score: number;
    text: string;
    sourceQuery: string;
    index: number;
  }

export class ExaRetriever extends BaseRetriever {
  private client: any;

  /*
  Create a new ExaRetriever instance
  */
  static async create() {
    const retriever = (await getRetrieverBySlug("exa")) as Retriever;
    if (!retriever || !retriever.key_value) {
      throw new Error("Exa API key not found in database.");
    }
    return new ExaRetriever(retriever);
  }

  /*
  Default constructor for ExaRetriever
  */
  private constructor(retriever: Retriever) {
    super();
    this.client = new Exa(retriever.key_value);
  }

  /*
  Search for queries using Exa and return a list of scientific papers
  */
  async search(project_title: string, queries: string[] = [], options: SearchOptions): Promise<research_paper[]> {
    let results: any[] = [];
    console.log(
      `Workspaceing ${options.linksPerQuery} results per query for:`,
      queries
    );
    if (project_title) {
      queries = [project_title, ...queries];
    }
    if (queries.length === 0) {
      return [];
    }
    for (const query of queries) {
      try {
        // Optional: Add sleep before each Exa call if needed
        // await sleep(500);
        const numResults = options.linksPerQuery || DEFAULT_OPTIONS.linksPerQuery;
        console.log(`Searching for ${numResults} results for query: ${query}`);
        const searchResponse = await this.client.searchAndContents(query, {
          numResults,
          useAutoprompt: options.useAutoprompt || DEFAULT_OPTIONS.useAutoprompt,
          type: options.type || DEFAULT_OPTIONS.type,
          category: options.category || DEFAULT_OPTIONS.category,
          text: { includeHtmlTags: false, maxCharacters: 2000 },
        });
        const resultsWithQuery: any[] = searchResponse.results.map((r: any) => ({
          ...r,
          sourceQuery: query,
        }));
        results.push(...resultsWithQuery);
      } catch (error) {
        console.log(
          `Error fetching Exa results for query "${query}":`,
          error
        );
      }
    }
    const indexedResults = results
      ?.filter((result) => result.title)
      ?.map((result, index) => ({ ...result, index: index + 1 }));
    console.log(`Found ${indexedResults.length} search results.`);
    console.info("Indexed search results:", indexedResults);
    return indexedResults;
  }
}
