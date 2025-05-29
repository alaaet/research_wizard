export abstract class BaseRetriever {
  /**
   * Factory method to create an instance of the agent.
   * Subclasses must implement this to handle async initialization (e.g., loading API keys).
   */
  static async create(...args: any[]): Promise<BaseRetriever | undefined> {
    throw new Error('BaseRetriever.create() must be implemented by subclasses');
  }

  abstract search({project_title, queries, keywords, options}: {project_title: string, queries: string[],keywords: string[], options: any}): Promise<any[]>;
}