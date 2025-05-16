// import type { AIAgent } from '../../../shared/aiAgentTypes';

// Unified abstract base class for all AI agents
export abstract class BaseAIAgent {
  /**
   * Factory method to create an instance of the agent.
   * Subclasses must implement this to handle async initialization (e.g., loading API keys).
   */
  static async create(...args: any[]): Promise<BaseAIAgent> {
    throw new Error('BaseAIAgent.create() must be implemented by subclasses');
  }

  /**
   * Get a response from the LLM.
   * @param params - Object containing system, user, temperature, model, etc.
   */
  abstract getLLMResponse(params: {
    system?: string;
    user: string;
    temperature?: number;
    model?: string;
    [key: string]: any;
  }): Promise<string>;

  // Optionally, shared logic for all agents can go here
  protected constructor() {}
}
