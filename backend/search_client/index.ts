import { listSearchRetrievers, getUserMetaDataByKey } from '../database';
import { research_paper } from '../../src/lib/researchPaper';
import { generateUID } from '../../src/lib/researchProject';
/**
 * Processes a search query by routing it to the active search retriever.
 * @param queries - Array of search queries
 * @param options - Search options for the retriever
 * @returns {Promise<any>} - The search results or error message
 */
export async function processSearch(queries: string[], options: any): Promise<any[]> {
  try {
    // Get the active search retriever
    const retrievers = (await listSearchRetrievers()) as any[];
    const activeRetriever = retrievers.find((r: any) => r.slug === options.retriever || r.is_active);
    if (!activeRetriever) {
      throw new Error('No active search retriever found.');
    }
    const slug = activeRetriever.slug;
    // Dynamically import the retriever class from the retrievers folder
    let RetrieverClass;
    switch (slug) {
      case 'exa': {
        const mod = await import('./retrievers/exa');
        RetrieverClass = mod.ExaRetriever;
        break;
      }
      // Add more cases for other retrievers as you implement them
      default:
        throw new Error(`Search retriever '${slug}' is not supported.`);
    }
    // Instantiate the retriever using its static create method
    const retriever = await RetrieverClass.create();
    // Send the queries to the retriever's search method
    const results = await retriever.search(queries, options);
    return results;
  } catch (err) {
    let message = '';
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }
    console.error(`[Search Error: ${message}]`);
    return []
  }
}

export async function getScientificPapers(project_uid: string, queries: string[], options: any): Promise<research_paper[]> {
    const linksPerQueryObject: any = await getUserMetaDataByKey('LINKS_PER_SEARCH_QUERY');
    const linksPerQuery = linksPerQueryObject?.value || 10;
    const papers = await processSearch(queries, {
        linksPerQuery,
        useAutoprompt: false,
        type: 'neural',
        category: 'research paper',
        ...options,
    });
    // console.log(papers);
    return papers?.map((paper: any) => ({
        uid: generateUID(),
        project_uid,
        title: paper.title,
        url: paper.url,
        publishedDate: paper.publishedDate,
        author: paper.author,
        score: paper.score,
        summary: paper.summary,
        sourceQuery: paper.sourceQuery,
        index: paper.index,
    }));
}