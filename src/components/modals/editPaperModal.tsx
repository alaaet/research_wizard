import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { research_paper } from '@/lib/researchPaper';

interface EditPaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: research_paper | null;
  onSave: (paper: research_paper) => void;
}

const EditPaperModal: React.FC<EditPaperModalProps> = ({ open, onOpenChange, paper, onSave }) => {
  const [editPaper, setEditPaper] = useState<research_paper | null>(paper);

  useEffect(() => {
    setEditPaper(paper);
  }, [paper]);

  if (!editPaper) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Paper</DialogTitle>
          <DialogDescription>Edit the details for this paper.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(editPaper);
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block font-medium mb-1">Title</label>
            <Input
              value={editPaper.title}
              onChange={e => setEditPaper({ ...editPaper, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Author</label>
            <Input
              value={editPaper.author}
              onChange={e => setEditPaper({ ...editPaper, author: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Summary</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-background"
              value={editPaper.summary}
              onChange={e => setEditPaper({ ...editPaper, summary: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Index</label>
            <Input
              type="number"
              value={editPaper.index}
              onChange={e => setEditPaper({ ...editPaper, index: Number(e.target.value) })}
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

export default EditPaperModal; 