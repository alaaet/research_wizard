import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { SearchRetriever } from '../../../shared/searchRetrieverTypes';
import { updateSearchRetriever } from '@/connectors/integrationsIpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react';

interface EditRetrieverModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editRetriever: SearchRetriever | null;
    setEditRetriever: (retriever: SearchRetriever | null) => void;
    setRetrievers: (retrievers: SearchRetriever[]) => void;
}

const EditRetrieverModal: React.FC<EditRetrieverModalProps> = ({ open, onOpenChange, editRetriever, setEditRetriever, setRetrievers }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Search Retriever</DialogTitle>
                    <DialogDescription>Edit the details for this search retriever.</DialogDescription>
                </DialogHeader>
                {editRetriever && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await updateSearchRetriever(editRetriever);
                            onOpenChange(false);
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block font-medium mb-1">Name</label>
                            <Input value={editRetriever.slug} disabled />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Active</label>
                            <input
                                type="checkbox"
                                checked={editRetriever.is_active}
                                onChange={e => setEditRetriever({ ...editRetriever, is_active: e.target.checked })}
                            />
                        </div>
                        {editRetriever.key_name && (
                            <div>
                                <label className="block font-medium mb-1">API Key Value</label>
                                <Input
                                    value={editRetriever.key_value}
                                    onChange={e => setEditRetriever({ ...editRetriever, key_value: e.target.value })}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditRetrieverModal; 