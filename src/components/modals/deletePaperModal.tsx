import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { research_paper } from '@/lib/researchPaper';

interface DeletePaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: research_paper | null;
  onDelete: (paper: research_paper) => void;
}

const DeletePaperModal: React.FC<DeletePaperModalProps> = ({ open, onOpenChange, paper, onDelete }) => {
  if (!paper) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Paper</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the paper <b>{paper.title}</b>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={() => { onDelete(paper); onOpenChange(false); }}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePaperModal; 