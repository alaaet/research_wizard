import { listAIAgents } from '../database';
import type { AIAgent } from '../../shared/aiAgentTypes';

/**
 * Processes a query by routing it to the active AI agent.
 * @param params - { user: string, system?: string, temperature?: number, model?: string }
 * @returns {Promise<string>} - The LLM response or error message
 */
export async function processQuery(params: {
  user: string;
  system?: string;
  temperature?: number;
  model?: string;
}) {
  try {
    // Get the active AI agent
    const agents = await listAIAgents() as AIAgent[];
    const activeAgent = agents.find((a: AIAgent) => a.is_active);
    if (!activeAgent) {
      throw new Error('No active AI agent found.');
    }
    const slug = activeAgent.slug;
    // Dynamically import the agent class from the agents folder
    let AgentClass;
    switch (slug) {
      case 'gemini': {
        // Import GeminiAgent
        const mod = await import('./agents/gemini');
        AgentClass = mod.GeminiAgent;
        break;
      }
      // Add more cases for other agents as you implement them
      default:
        throw new Error(`AI agent '${slug}' is not supported.`);
    }
    // Instantiate the agent using its static create method
    const agent = await AgentClass.create();
    // Send the query to the agent's getLLMResponse method
    const response = await agent.getLLMResponse(params);
    return response;
  } catch (err) {
    let message = '';
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }
    return `[AI Error: ${message}]`;
  }
}

export async function generateResearchKeywordsFromTopic(topic: string) {
  const response = await processQuery({
    user: `Generate 5 academic research keywords for the topic: ${topic}, the keywords should be three words or less, the keywords should be in the form of a new line separated list with no numbers, the response should only contain the keywords`,
  });
  const keywords = response.split('\n').map(line => line.trim());
  console.log('Generated keywords:', keywords);
  return keywords;
}

export async function generateResearchQuestionsFromTopic(topic: string) {
  const response = await processQuery({
    user: `Generate 5 research questions for the topic: ${topic}, the questions should be in the form of a new line separated list with no numbers, the response should only contain the questions`,
  });
  const questions = response.split('\n').map(line => line.trim());
  console.log('Generated questions:', questions);
  return questions;
}

export async function generateResearchQueriesFromQuestions(questions: string[]) {
  const response = await processQuery({
    user: `Generate 5 research queries for the questions: ${questions.join(', ')}, the queries should be in the form of a new line separated list with no numbers, the response should only contain the queries`,
  });
  const queries = response.split('\n').map(line => line.trim());
  console.log('Generated queries:', queries);
  return queries;
}

