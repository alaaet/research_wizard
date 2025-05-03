
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, Upload, Printer } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';

interface ImportExportControlsProps {
  moduleName: string;
  className?: string;
  onImportComplete?: () => void;
}

const ImportExportControls: React.FC<ImportExportControlsProps> = ({ 
  moduleName,
  className = "",
  onImportComplete
}) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { exportModuleData, importModuleData, printModuleData } = useCRM();
  
  const handleImportClick = () => {
    setImportDialogOpen(true);
  };
  
  const handleImportConfirm = async () => {
    if (!selectedFile) {
      console.error("Aucun fichier sélectionné");
      return;
    }
    
    try {
      const success = await importModuleData(moduleName, selectedFile);
      
      if (success && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error(`Error importing ${moduleName}:`, error);
    }
    
    setImportDialogOpen(false);
    setSelectedFile(null);
  };
  
  const handleExportClick = () => {
    setExportDialogOpen(true);
  };
  
  const handleExportConfirm = async () => {
    try {
      await exportModuleData(moduleName, exportFormat);
    } catch (error) {
      console.error(`Error exporting ${moduleName}:`, error);
    }
    
    setExportDialogOpen(false);
  };
  
  const handlePrintClick = async () => {
    try {
      await printModuleData(moduleName);
    } catch (error) {
      console.error(`Error printing ${moduleName}:`, error);
    }
  };
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleExportClick}
      >
        <Download className="h-4 w-4" />
        Exporter
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleImportClick}
      >
        <Upload className="h-4 w-4" />
        Importer
      </Button>
      
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handlePrintClick}
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des données</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Fichier CSV</Label>
              <input 
                type="file" 
                id="file" 
                accept=".csv" 
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Les données seront importées dans le module {moduleName}. 
              Assurez-vous que le fichier est au format CSV.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleImportConfirm}>Importer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter des données</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format d'export</Label>
              <div className="flex gap-2">
                <Button 
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="flex-1"
                >
                  CSV
                </Button>
                <Button 
                  variant={exportFormat === 'excel' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('excel')}
                  className="flex-1"
                >
                  Excel
                </Button>
                <Button 
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pdf')}
                  className="flex-1"
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleExportConfirm}>Exporter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExportControls;
