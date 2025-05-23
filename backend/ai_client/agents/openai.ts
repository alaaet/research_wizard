import OpenAI from 'openai';
import type { AIAgent } from '../../../shared/aiAgentTypes';
import { getAIAgentBySlug } from '../../database';
import { BaseAIAgent } from './BaseAIAgent';

const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';

export class OpenAIAgent extends BaseAIAgent {
  private client: OpenAI;
  private apiKey: string;

  static async create() {
    const agent = (await getAIAgentBySlug('openai')) as AIAgent;
    if (!agent || !agent.key_value) {
      throw new Error('OpenAI API key not found in database.');
    }
    return new OpenAIAgent(agent);
  }

  private constructor(agent: AIAgent) {
    super();
    this.apiKey = agent.key_value;
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async getLLMResponse({
    system = 'You are a helpful assistant.',
    user = '',
    temperature = 1,
    model = DEFAULT_OPENAI_MODEL,
    ...rest
  }): Promise<string> {
    // override the temperature to 1
    temperature = 1;
    try {
      if (!user) {
        throw new Error('User prompt is required.');
      }
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ];
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        ...rest,
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI.');
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
