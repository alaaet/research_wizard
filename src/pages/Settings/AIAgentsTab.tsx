import React, { useEffect, useState } from 'react';
import type { AIAgent } from '../../../shared/aiAgentTypes';
import { getAIAgents } from '../../utils/aiAgentsIpc';
import { Card } from '../../components/ui/card';
import { Check } from 'lucide-react';
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme';
import EditAIAgentModal from '../../components/modals/editAIAgentModal';
import { Label } from '@/components/ui/label';
import { getUserMetaDataByRef, setUserMetaData, type UserMetaData } from '../../utils/userMetaDataIpc';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function AIAgentsTab() {
  const [aiAgents, setAIAgents] = useState<AIAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [editAgent, setEditAgent] = useState<AIAgent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const isDark = useIsDarkTheme();

  // AI PARAMS state
  const [aiParams, setAIParams] = useState<UserMetaData[]>([]);
  const [aiEditValues, setAIEditValues] = useState<Record<string, string>>({});
  const [aiSavingKey, setAISavingKey] = useState<string | null>(null);
  const [aiSuccessKey, setAISuccessKey] = useState<string | null>(null);
  const [aiErrorKey, setAIErrorKey] = useState<string | null>(null);

  useEffect(() => {
    getAIAgents().then(agents => {
      setAIAgents(agents || []);
      setLoadingAgents(false);
    });
    getUserMetaDataByRef('ai').then((data) => {
      setAIParams(data || []);
      setAIEditValues(Object.fromEntries((data || []).map(f => [f.Key, f.Value])));
    });
  }, []);

  const handleAIParamChange = (key: string, value: string) => {
    setAIEditValues(v => ({ ...v, [key]: value }));
  };

  const handleAISave = async (field: UserMetaData) => {
    setAISavingKey(field.Key);
    setAISuccessKey(null);
    setAIErrorKey(null);
    try {
      await setUserMetaData(field.Key, aiEditValues[field.Key], field.Type);
      setAISuccessKey(field.Key);
      setTimeout(() => setAISuccessKey(null), 2000);
    } catch (err) {
      setAIErrorKey(field.Key);
    }
    setAISavingKey(null);
  };

  return (
    <>
      {loadingAgents ? (
        <div>Loading AI agents...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {aiAgents.map(agent => {
            const iconUrl = `../assets/ai_providers/${agent.icon}`;
            return (
              <Card
                key={agent.slug}
                className="relative aspect-square flex flex-col items-center justify-between p-4 cursor-pointer bg-rwiz-secondary hover:bg-rwiz-secondary-light"
                onClick={() => { setEditAgent(agent); setEditOpen(true); }}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="font-bold text-lg capitalize">{agent.slug}</span>
                  {agent.is_active && (
                    <Check className="text-green-500 w-6 h-6 absolute top-2 right-2 rounded-full shadow bg-white" size={30} strokeWidth={4}/>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={iconUrl + (isDark? '-light.png' :'-dark.png')}
                    className="w-20 h-20 object-contain mx-auto"
                    alt={agent.slug}
                    style={{ maxHeight: '60%' }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <hr className='w-full my-4'/>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setAISavingKey('all');
          setAISuccessKey(null);
          setAIErrorKey(null);
          try {
            for (const field of aiParams) {
              await setUserMetaData(field.Key, aiEditValues[field.Key], field.Type);
            }
            setAISuccessKey('all');
            setTimeout(() => setAISuccessKey(null), 2000);
          } catch (err) {
            setAIErrorKey('all');
          }
          setAISavingKey(null);
        }}
      >
        <Label className='text-lg font-bold text-center mb-4 w-full'>AI Params</Label>
        {aiParams.map(field => (
          <div key={field.Key} className="space-y-1">
            <label className="block font-medium">{field.label || field.Key}</label>
            {field.Type === 'string' || field.Type === 'number' ? (
              <Input
                value={aiEditValues[field.Key] ?? ''}
                onChange={e => handleAIParamChange(field.Key, e.target.value)}
                type={field.Type === 'number' ? 'number' : 'text'}
              />
            ) : (
              <textarea
                className="w-full border rounded px-3 py-2 bg-background"
                value={aiEditValues[field.Key] ?? ''}
                onChange={e => handleAIParamChange(field.Key, e.target.value)}
                rows={3}
              />
            )}
          </div>
        ))}
        <Button
          className="mt-4 self-end"
          size="sm"
          type="submit"
          disabled={aiSavingKey === 'all'}
        >
          {aiSavingKey === 'all' ? 'Saving...' : 'Save'}
        </Button>
        {aiSuccessKey === 'all' && <span className="text-green-600 ml-2">Saved!</span>}
        {aiErrorKey === 'all' && <span className="text-red-500 ml-2">Error!</span>}
      </form>
      <EditAIAgentModal
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditAgent(null);
          if (!open) getAIAgents().then(agents => setAIAgents(agents || []));
        }}
        editAgent={editAgent}
        setEditAgent={setEditAgent}
        setAIAgents={setAIAgents}
      />
    </>
  );
} 