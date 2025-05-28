import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Resource } from '@/lib/Resource';

interface EditResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onSave: (resource: Resource) => void;
}

const EditResourceModal: React.FC<EditResourceModalProps> = ({ open, onOpenChange, resource, onSave }) => {
  const [editResource, setEditResource] = useState<Resource | null>(resource);

  useEffect(() => {
    setEditResource(resource);
  }, [resource]);

  if (!editResource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Edit the details for this resource.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(editResource);
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block font-medium mb-1">Title</label>
            <Input
              value={editResource.title}
              onChange={e => setEditResource({ ...editResource, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Author</label>
            <Input
              value={editResource.author}
              onChange={e => setEditResource({ ...editResource, author: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Summary</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-background"
              value={editResource.summary}
              onChange={e => setEditResource({ ...editResource, summary: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Index</label>
            <Input
              type="number"
              value={editResource.index}
              onChange={e => setEditResource({ ...editResource, index: Number(e.target.value) })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditResourceModal; 