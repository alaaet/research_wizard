export abstract class BaseRetriever {
  /**
   * Factory method to create an instance of the agent.
   * Subclasses must implement this to handle async initialization (e.g., loading API keys).
   */
  static async create(...args: any[]): Promise<BaseRetriever> {
    throw new Error('BaseRetriever.create() must be implemented by subclasses');
  }

  abstract search(queries: string[], options: any): Promise<any[]>;
}