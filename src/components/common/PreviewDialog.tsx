
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  moduleName: string;
  previewHTML: string;
  onPrint: () => void;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  onOpenChange,
  title,
  moduleName,
  previewHTML,
  onPrint
}) => {
  const { settings } = useAppSettings();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title || `Aperçu - ${moduleName}`}</DialogTitle>
          <DialogDescription>
            Aperçu avant impression
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto border rounded-md mt-4 bg-white">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html lang="${settings.locale || 'fr'}">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${title || `Aperçu - ${moduleName}`}</title>
                  <style>
                    :root {
                      --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      --primary-color: ${settings.darkMode ? '#8BADE3' : '#4CAF50'};
                      --border-color: ${settings.darkMode ? '#3A3A3A' : '#e5e7eb'};
                      --bg-color: ${settings.darkMode ? '#1F1F1F' : '#ffffff'};
                      --text-color: ${settings.darkMode ? '#E1E1E1' : '#333333'};
                      --muted-color: ${settings.darkMode ? '#A0A0A0' : '#6B7280'};
                      --header-bg: ${settings.darkMode ? '#2D2D2D' : '#F9FAFB'};
                    }
                    
                    body {
                      font-family: var(--font-family);
                      margin: 0;
                      padding: 0;
                      background-color: var(--bg-color);
                      color: var(--text-color);
                    }
                    
                    .preview-container {
                      max-width: 100%;
                      margin: 0 auto;
                      border: 1px solid var(--border-color);
                      border-radius: 8px;
                      overflow: hidden;
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    }
                    
                    .preview-header {
                      background-color: var(--header-bg);
                      padding: 20px;
                      border-bottom: 1px solid var(--border-color);
                    }
                    
                    .preview-header h2 {
                      margin: 0;
                      font-size: 20px;
                      color: var(--text-color);
                    }
                    
                    .preview-content {
                      padding: 20px;
                    }
                    
                    table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 20px;
                      font-size: 14px;
                    }
                    
                    th {
                      background-color: var(--header-bg);
                      padding: 10px 15px;
                      text-align: left;
                      font-weight: 600;
                      border-bottom: 2px solid var(--border-color);
                      color: var(--text-color);
                    }
                    
                    td {
                      padding: 10px 15px;
                      border-bottom: 1px solid var(--border-color);
                    }
                    
                    tr:nth-child(even) {
                      background-color: ${settings.darkMode ? '#2A2A2A' : '#f9fafb'};
                    }
                    
                    tr:hover {
                      background-color: ${settings.darkMode ? '#333333' : '#f3f4f6'};
                    }
                    
                    .footer {
                      margin-top: 30px;
                      text-align: right;
                      font-size: 12px;
                      color: var(--muted-color);
                      padding-top: 10px;
                      border-top: 1px solid var(--border-color);
                    }

                    @media print {
                      body {
                        padding: 0;
                        background-color: white;
                        color: black;
                      }
                      button { display: none; }
                      .preview-container {
                        box-shadow: none;
                        border: none;
                      }
                      table, th, td {
                        color: black;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="preview-container">
                    ${previewHTML}
                  </div>
                </body>
              </html>
            `}
            className="w-full h-full border-none"
            title="Preview"
            aria-label={`Aperçu du document: ${title || moduleName}`}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
          <Button onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
