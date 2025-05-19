import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { research_paper } from '@/lib/researchPaper';
import { generateUID } from '@/lib/researchProject';

interface AddPaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (paper: research_paper) => void;
}

const AddPaperModal: React.FC<AddPaperModalProps> = ({ open, onOpenChange, onAdd }) => {
  const [form, setForm] = useState<Partial<research_paper>>({});

  const handleChange = (field: keyof research_paper, value: any) => {
    if (field === 'publishedDate') {
      setForm(f => ({ ...f, publishedDate: value ? new Date(value) : undefined }));
    } else if (field === 'index') {
      setForm(f => ({ ...f, index: Number(value) }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.url) return;
    const newPaper: research_paper = {
      uid: generateUID(),
      project_uid: '', // Should be set by parent if needed
      title: form.title!,
      url: form.url!,
      publishedDate: form.publishedDate instanceof Date ? form.publishedDate : new Date(),
      author: form.author!,
      score: form.score || 0,
      summary: form.summary || '',
      sourceQuery: form.sourceQuery || '',
      index: form.index || 0,
    };
    onAdd(newPaper);
    setForm({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Paper</DialogTitle>
          <DialogDescription>Enter the details for the new paper.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <Input value={form.title || ''} onChange={e => handleChange('title', e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Author</label>
            <Input value={form.author || ''} onChange={e => handleChange('author', e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">URL</label>
            <Input value={form.url || ''} onChange={e => handleChange('url', e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Published Date</label>
            <Input
              type="date"
              value={form.publishedDate instanceof Date ? form.publishedDate.toISOString().slice(0, 10) : ''}
              onChange={e => handleChange('publishedDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Summary</label>
            <textarea className="w-full border rounded px-3 py-2 bg-background" value={form.summary || ''} onChange={e => handleChange('summary', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit">Add Paper</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaperModal; 