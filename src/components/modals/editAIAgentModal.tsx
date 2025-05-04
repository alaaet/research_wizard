import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { AIAgent } from '../../../shared/aiAgentTypes';
import { updateAIAgent } from '@/utils/aiAgentsIpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface EditAIAgentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editAgent: AIAgent | null;
    setEditAgent: (agent: AIAgent | null) => void;
    setAIAgents: (agents: AIAgent[]) => void;
}

const EditAIAgentModal: React.FC<EditAIAgentModalProps> = ({ open, onOpenChange, editAgent, setEditAgent, setAIAgents }) => {
    const [newModel, setNewModel] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit AI Agent</DialogTitle>
                    <DialogDescription>Edit the details for this AI agent.</DialogDescription>
                </DialogHeader>
                {editAgent && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await updateAIAgent(editAgent);
                            onOpenChange(false);
                            // Optionally refresh agents list (parent should call getAIAgents and setAIAgents)
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block font-medium mb-1">Name</label>
                            <Input value={editAgent.slug} disabled />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Active</label>
                            <input
                                type="checkbox"
                                checked={editAgent.is_active}
                                onChange={e => setEditAgent({ ...editAgent, is_active: e.target.checked })}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">API Key Value</label>
                            <Input
                                value={editAgent.key_value}
                                onChange={e => setEditAgent({ ...editAgent, key_value: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Supported Models</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editAgent.available_models.map((model, idx) => (
                                    <Badge key={model} variant="secondary" className="flex items-center gap-1 bg-rwiz-secondary hover:bg-rwiz-secondary-light">
                                        {model}
                                        <button
                                            type="button"
                                            className="ml-1 text-xs text-red-500 hover:text-red-700"
                                            onClick={() => setEditAgent({
                                                ...editAgent,
                                                available_models: editAgent.available_models.filter((_, i) => i !== idx),
                                                selected_model: editAgent.selected_model === model ? '' : editAgent.selected_model
                                            })}
                                            aria-label={`Remove ${model}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <Input
                                type="text"
                                placeholder="Add model name and press Enter"
                                value={newModel}
                                onChange={e => setNewModel(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && newModel.trim()) {
                                        e.preventDefault();
                                        if (!editAgent.available_models.includes(newModel.trim())) {
                                            setEditAgent({
                                                ...editAgent,
                                                available_models: [...editAgent.available_models, newModel.trim()],
                                            });
                                            setNewModel('');
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Selected Model</label>

                            <Select
                                value={editAgent.selected_model}
                                onValueChange={val => setEditAgent({ ...editAgent, selected_model: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {editAgent.available_models.map(model => (
                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditAIAgentModal;