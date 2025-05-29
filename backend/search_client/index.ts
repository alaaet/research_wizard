import { listSearchRetrievers, getUserMetaDataByKey } from '../database';
import { Resource } from '../../src/lib/Resource';
import { generateUID } from '../../src/lib/researchProject';
/**
 * Processes a search query by routing it to the active search retriever.
 * @param queries - Array of search queries
 * @param options - Search options for the retriever
 * @returns {Promise<any>} - The search results or error message
 */
export async function processSearch(project_title: string, queries: string[], keywords: string[], options: any): Promise<any[]> {
  try {
    // Get the active search retriever
    const retrievers = (await listSearchRetrievers()) as any[];
    // First try to find the explicitly specified retriever, then fall back to active retriever
    const activeRetriever = options.retriever 
      ? retrievers.find((r: any) => r.slug.toLowerCase() === options.retriever.toLowerCase())
      : retrievers.find((r: any) => r.is_active);
      
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
      case 'crossref': {
        const mod = await import('./retrievers/crossref');
        RetrieverClass = mod.CrossrefRetriever;
        break;
      }
      case 'dblp': {
        const mod = await import('./retrievers/dblp');
        RetrieverClass = mod.DblpRetriever;
        break;
      }
      case 'plos': {
        const mod = await import('./retrievers/plos');
        RetrieverClass = mod.PlosRetriever;
        break;
      }
      case 'openalex': {
        const mod = await import('./retrievers/open_alex');
        RetrieverClass = mod.OpenAlexRetriever;
        break;
      }
      case 'europmc': {
        const mod = await import('./retrievers/europmc');
        RetrieverClass = mod.EuropePMCRetriever;
        break;
      }
      case 'coreapi': {
        const mod = await import('./retrievers/core_api');
        RetrieverClass = mod.CoreAPIRetriever;
        break;
      }
      case 'elsevier': {
        const mod = await import('./retrievers/elsevier');
        RetrieverClass = mod.ElsevierRetriever;
        break;
      }
      case 'ncbi_nih': {
        const mod = await import('./retrievers/ncbi_nih');
        RetrieverClass = mod.NcbiNihRetriever;
        break;
      }
      case 'arxiv': {
        const mod = await import('./retrievers/arXiv');
        RetrieverClass = mod.ArxivRetriever;
        break;
      }
      case 'semanticscholar': {
        const mod = await import('./retrievers/semantic');
        RetrieverClass = mod.SemanticScholarRetriever;
        break;
      }
      // Add more cases for other retrievers as you implement them
      default:
        throw new Error(`Search retriever '${slug}' is not supported.`);
    }
    // Instantiate the retriever using its static create method
    const retriever = await RetrieverClass.create();
    // Send the queries to the retriever's search method
    const results = await retriever.search({project_title, queries, keywords, options});
    return results;
  } catch (err) {
    let message = '';
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }
    console.log(`[Search Error: ${message}]`);
    return []
  }
}

export async function getResources(project_uid: string, project_title: string, queries: string[], keywords: string[], options: any): Promise<Resource[]> {
    const linksPerQueryObject: any = await getUserMetaDataByKey('LINKS_PER_SEARCH_QUERY');
    const linksPerQuery = linksPerQueryObject?.value || 10;
    const resources = await processSearch(project_title, queries, keywords, {
        linksPerQuery,
        useAutoprompt: false,
        type: options.type || 'neural',
        category: options.category || 'resource',
        ...options,
    });
    return resources?.map((resource: any) => ({
        uid: generateUID(),
        project_uid,
        title: resource.title,
        url: resource.url,
        publishedDate: resource.publishedDate,
        author: resource.author,
        score: resource.score,
        summary: resource.summary,
        sourceQuery: resource.sourceQuery,
        index: resource.index,
        resource_type: resource.resource_type || 'paper',
    }));
}