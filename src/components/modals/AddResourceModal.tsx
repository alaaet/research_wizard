import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Resource } from '@/lib/Resource';
import { generateUID } from '@/lib/researchProject';
import { showOpenFileDialog } from '../../connectors/resourceIpc';

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (resource: Resource) => void;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ open, onOpenChange, onAdd }) => {
  const [form, setForm] = useState<Partial<Resource>>({});

  const handleChange = (field: keyof Resource, value: any) => {
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
    if (!form.title || !form.url) return;
    const newResource: Resource = {
      uid: generateUID(),
      project_uid: '', // Should be set by parent if needed
      title: form.title!,
      url: form.url!,
      publishedDate: form.publishedDate instanceof Date ? form.publishedDate : new Date(),
      author: form.author || '',
      score: form.score || 0,
      summary: form.summary || '',
      sourceQuery: form.sourceQuery || '',
      index: form.index || 0,
      resource_type: form.resource_type || 'paper',
    };
    onAdd(newResource);
    setForm({});
    onOpenChange(false);
  };

  const handleAddLocalFile = async () => {
    const filePaths = await showOpenFileDialog();
    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      setForm(f => ({
        ...f,
        title: fileName,
        url: filePath,
        resource_type: 'local_file',
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>Enter the details for the new resource (paper, book, web article, etc.).</DialogDescription>
        </DialogHeader>
        <div className="mb-2">
          <Button type="button" onClick={handleAddLocalFile}>
            Add Local File
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <Input value={form.title || ''} onChange={e => handleChange('title', e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Author</label>
            <Input value={form.author || ''} onChange={e => handleChange('author', e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1">URL</label>
            <Input value={form.url || ''} onChange={e => handleChange('url', e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Type</label>
            <select value={form.resource_type || 'paper'} onChange={e => handleChange('resource_type', e.target.value)}>
              <option value="paper">Paper</option>
              <option value="book">Book</option>
              <option value="web_article">Web Article</option>
              <option value="other">Other</option>
            </select>
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
            <Button type="submit">Add Resource</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceModal; 