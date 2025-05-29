import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Resource } from '@/lib/Resource';
import { extractResourceFromUrl } from '../../connectors/resourceIpc';

interface ImportFromUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (resource: Resource) => void;
}

const ImportFromUrlModal: React.FC<ImportFromUrlModalProps> = ({ open, onOpenChange, onImport }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resource = await extractResourceFromUrl(url);
      if (resource) {
        onImport(resource);
        setUrl('');
        onOpenChange(false);
      } else {
        setError('Failed to extract resource from URL.');
      }
    } catch (err) {
      setError('Failed to extract resource from URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Resource from URL</DialogTitle>
          <DialogDescription>Paste the URL of the web page, article, or paper you want to import.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">URL</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://..." />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? 'Importing...' : 'Import'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromUrlModal; 