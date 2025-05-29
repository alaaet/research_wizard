import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Resource } from '@/lib/Resource';
import { showOpenFileDialog, extractResourceFromPDF, extractResourceFromDocx, extractResourceFromTxt } from '../../connectors/resourceIpc';

interface ImportFromFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (resources: Resource[]) => void;
}

const fileTypeExtractors: { [ext: string]: (filePath: string) => Promise<Resource> } = {
  pdf: extractResourceFromPDF,
  docx: extractResourceFromDocx,
  txt: extractResourceFromTxt,
};

const ImportFromFolderModal: React.FC<ImportFromFolderModalProps> = ({ open, onOpenChange, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const filePaths = await showOpenFileDialog();
      if (!filePaths || filePaths.length === 0) {
        setLoading(false);
        return;
      }
      const resources: Resource[] = [];
      for (const filePath of filePaths) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const extractor = ext && fileTypeExtractors[ext];
        if (extractor) {
          try {
            const resource = await extractor(filePath);
            if (resource) resources.push(resource);
          } catch (e) {
            // skip file on error
          }
        }
      }
      if (resources.length > 0) {
        onImport(resources);
        onOpenChange(false);
      } else {
        setError('No supported files were selected.');
      }
    } catch (err) {
      setError('Failed to import resources from files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Resources from Local Files</DialogTitle>
          <DialogDescription>Select PDF, DOCX, or TXT files to import as resources.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <DialogFooter>
          <Button type="button" onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : 'Select Files and Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromFolderModal; 