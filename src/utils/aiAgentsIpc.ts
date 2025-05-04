export type AIAgent = {
  slug: string;
  is_active: boolean;
  available_models: string[];
  selected_model: string;
  key_name: string;
  key_value: string;
  icon: string;
};

export async function getAIAgents(): Promise<AIAgent[]> {
  return await window.electron?.invoke('aiAgents:list');
}
