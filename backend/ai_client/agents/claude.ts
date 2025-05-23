import Anthropic from '@anthropic-ai/sdk';
import type { AIAgent } from '../../../shared/aiAgentTypes';
import { getAIAgentBySlug } from '../../database';
import { BaseAIAgent } from './BaseAIAgent';

const DEFAULT_CLAUDE_MODEL = 'claude-3-opus-20240229';

export class ClaudeAIAgent extends BaseAIAgent {
  private client: Anthropic;
  private apiKey: string;

  static async create() {
    const agent = (await getAIAgentBySlug('claude')) as AIAgent;
    if (!agent || !agent.key_value) {
      throw new Error('Anthropic API key not found in database.');
    }
    return new ClaudeAIAgent(agent);
  }

  private constructor(agent: AIAgent) {
    super();
    this.apiKey = agent.key_value;
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  async getLLMResponse({
    system = 'You are a helpful assistant.',
    user = '',
    temperature = 0.7,
    model = DEFAULT_CLAUDE_MODEL,
    ...rest
  }): Promise<string> {
    try {
      if (!user) {
        throw new Error('User prompt is required.');
      }
      const messages = [
        { role: 'user', content: user },
      ];
      // Anthropic Claude expects a single prompt string, not OpenAI-style messages
      // We'll concatenate system and user for the prompt
      const prompt = `${system}\n\n${user}`;
      const response = await this.client.messages.create({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        ...rest,
      });
      const content = response.content
        ?.filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');
      if (!content) {
        throw new Error('No content returned from Claude.');
      }
      return content.trim();
    } catch (error) {
      let message = '';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error && 'message' in error) {
        message = (error as any).message;
      } else {
        message = String(error);
      }
      return `[Error generating LLM response: ${message}]`;
    }
  }
}
