import type { AIAgent } from '../../shared/aiAgentTypes';

export async function getAIAgents(): Promise<AIAgent[]> {
  return await window.electron?.invoke('aiAgents:list');
}

export async function updateAIAgent(agent: AIAgent): Promise<{ success: boolean; error?: string }> {
  return await window.electron?.invoke('aiAgents:update', agent);
}

export async function generateResearchKeywordsFromTopic(topic: string): Promise<string[]> {
  return await window.electron?.invoke('aiAgents:generateResearchKeywordsFromTopic', topic);
}

export async function generateResearchQuestionsFromTopic(topic: string): Promise<string[]> {
  return await window.electron?.invoke('aiAgents:generateResearchQuestionsFromTopic', topic);
}

