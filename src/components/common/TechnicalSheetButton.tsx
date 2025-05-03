
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download, Eye, Printer } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PreviewContainer from './PreviewContainer';

interface TechnicalSheetButtonProps {
  data: any;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
}

const TechnicalSheetButton: React.FC<TechnicalSheetButtonProps> = ({ 
  data, 
  className = "",
  variant = "default",
  children,
  size = "default"
}) => {
  const { exportModuleData } = useCRM();
  const { settings } = useAppSettings();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  
  // Format data for the technical sheet
  const formatTechSheetData = () => {
    if (!data || Object.keys(data).length === 0) {
      console.error("Données insuffisantes pour générer la fiche technique");
      return null;
    }
    
    return [{
      nom: data.name || data.nom || "Non spécifié",
      nomScientifique: data.scientificName || data.nomScientifique || "Non spécifié",
      famille: data.family || data.famille || "Non spécifiée",
      origine: data.origin || data.origine || "Non spécifiée",
      saisonCulture: data.growingSeason || data.saisonCulture || "Non spécifiée",
      typeSol: data.soilType || data.typeSol || "Non spécifié",
      besoinEau: data.waterNeeds || data.besoinEau || "Non spécifié",
      fertilisation: data.fertilization || data.fertilisation || "Non spécifiée",
      ravageurs: data.pests || data.ravageurs || "Non spécifiés",
      maladies: data.diseases || data.maladies || "Non spécifiées",
      notes: data.notes || "Aucune note",
      type: data.type || "Non spécifié",
      periodeRecolte: data.harvestPeriod || data.periodeRecolte || "Non spécifiée",
      rendementHectare: data.yieldPerHectare || data.rendementHectare || data.currentYield || "Non spécifié"
    }];
  };
  
  const downloadTechnicalSheet = async () => {
    const techSheetData = formatTechSheetData();
    if (!techSheetData) return;

    setIsGenerating(true);
    
    try {
      await exportModuleData('fiche_technique', 'pdf', techSheetData);
      console.log("Fiche technique générée avec succès");
    } catch (error) {
      console.error("Error generating technical sheet:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generatePreviewHTML = () => {
    const techSheetData = formatTechSheetData();
    if (!techSheetData) return '';
    
    const item = techSheetData[0];
    const isDarkMode = settings.darkMode;
    
    return `
      <div class="technical-sheet">
        <div class="technical-sheet-header text-center mb-8">
          <h1 class="text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}">${item.nom}</h1>
          <p class="italic">${item.nomScientifique}</p>
        </div>
        
        <div class="section mb-6">
          <h2 class="text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'} border-b pb-2 mb-4">Informations générales</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">Famille:</span>
              ${item.famille}
            </div>
            <div>
              <span class="font-medium">Origine:</span>
              ${item.origine}
            </div>
            <div>
              <span class="font-medium">Type:</span>
              ${item.type}
            </div>
            <div>
              <span class="font-medium">Saison de culture:</span>
              ${item.saisonCulture}
            </div>
          </div>
        </div>
        
        <div class="section mb-6">
          <h2 class="text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'} border-b pb-2 mb-4">Conditions de culture</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">Type de sol:</span>
              ${item.typeSol}
            </div>
            <div>
              <span class="font-medium">Besoin en eau:</span>
              ${item.besoinEau}
            </div>
            <div>
              <span class="font-medium">Fertilisation:</span>
              ${item.fertilisation}
            </div>
            <div>
              <span class="font-medium">Période de récolte:</span>
              ${item.periodeRecolte}
            </div>
            <div>
              <span class="font-medium">Rendement par hectare:</span>
              ${item.rendementHectare}
            </div>
          </div>
        </div>
        
        <div class="section mb-6">
          <h2 class="text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'} border-b pb-2 mb-4">Problèmes phytosanitaires</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">Ravageurs:</span>
              ${item.ravageurs}
            </div>
            <div>
              <span class="font-medium">Maladies:</span>
              ${item.maladies}
            </div>
          </div>
        </div>
        
        <div class="section mb-6">
          <h2 class="text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'} border-b pb-2 mb-4">Notes</h2>
          <div class="${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-md">
            ${item.notes}
          </div>
        </div>
      </div>
    `;
  };
  
  const handleShowPreview = () => {
    setPreviewHTML(generatePreviewHTML());
    setPreviewOpen(true);
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isDarkMode = settings.darkMode;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fiche Technique - ${data.name || data.nom || 'Culture'}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              :root {
                --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                --primary-color: ${isDarkMode ? '#8BADE3' : '#4CAF50'};
                --border-color: ${isDarkMode ? '#3A3A3A' : '#e5e7eb'};
                --bg-color: ${isDarkMode ? '#1F1F1F' : '#ffffff'};
                --text-color: ${isDarkMode ? '#E1E1E1' : '#333333'};
                --muted-color: ${isDarkMode ? '#A0A0A0' : '#6B7280'};
                --header-bg: ${isDarkMode ? '#2D2D2D' : '#F9FAFB'};
              }
              
              body { 
                font-family: var(--font-family);
                margin: 0; 
                padding: 20px;
                background-color: var(--bg-color);
                color: var(--text-color);
              }
              
              .technical-sheet {
                max-width: 800px;
                margin: 0 auto;
                background-color: var(--bg-color);
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              
              h1 { color: var(--primary-color); margin-top: 0; }
              
              h2 { 
                color: ${isDarkMode ? '#4B96E6' : '#1565c0'}; 
                border-bottom: 1px solid var(--border-color); 
                padding-bottom: 5px;
              }
              
              .section { margin-bottom: 20px; }
              
              .grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }
              
              .font-medium { font-weight: bold; }
              
              .bg-gray-50 { 
                background-color: ${isDarkMode ? '#2A2A2A' : '#f9f9f9'}; 
                padding: 15px; 
                border-radius: 5px;
              }
              
              @media print {
                body { background-color: white; }
                .technical-sheet { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="technical-sheet">
              ${generatePreviewHTML()}
              
              <div class="footer text-center text-sm text-muted-color mt-8">
                <p>Fiche technique générée le ${new Date().toLocaleDateString(settings.locale)}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    }
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={variant}
                  size={size}
                  className={`transition-all duration-300 ${className || `bg-green-600 hover:bg-green-700 text-white`}`}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : children || (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger fiche technique
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border shadow-lg">
                <DropdownMenuItem onClick={handleShowPreview} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Aperçu</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Imprimer</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTechnicalSheet} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  <span>Télécharger PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent className="bg-white border shadow-lg">
            <p>Générer une fiche technique détaillée</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Fiche Technique - {data?.name || data?.nom || 'Culture'}</DialogTitle>
            <DialogDescription>
              Aperçu de la fiche technique
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-auto border rounded-md mt-4 bg-white">
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      :root {
                        --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        --primary-color: ${settings.darkMode ? '#8BADE3' : '#4CAF50'};
                        --border-color: ${settings.darkMode ? '#3A3A3A' : '#e5e7eb'};
                        --bg-color: ${settings.darkMode ? '#1F1F1F' : '#ffffff'};
                        --text-color: ${settings.darkMode ? '#E1E1E1' : '#333333'};
                        --muted-color: ${settings.darkMode ? '#A0A0A0' : '#6B7280'};
                        --header-bg: ${settings.darkMode ? '#2D2D2D' : '#F9FAFB'};
                        --card-bg: ${settings.darkMode ? '#2A2A2A' : '#f9fafb'};
                      }
                      
                      body {
                        font-family: var(--font-family);
                        margin: 0; 
                        padding: 0;
                        background-color: var(--bg-color);
                        color: var(--text-color);
                      }
                      
                      .technical-sheet {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 30px;
                      }
                      
                      .technical-sheet-header {
                        text-align: center;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                        border-bottom: 1px solid var(--border-color);
                      }
                      
                      .technical-sheet-header h1 {
                        margin: 0 0 10px 0;
                        color: var(--primary-color);
                      }
                      
                      .section {
                        margin-bottom: 30px;
                      }
                      
                      .section h2 {
                        color: ${settings.darkMode ? '#4B96E6' : '#1565c0'};
                        padding-bottom: 8px;
                        margin-top: 0;
                        border-bottom: 1px solid var(--border-color);
                      }
                      
                      .grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                      }
                      
                      .grid > div {
                        padding: 10px;
                        border-radius: 6px;
                        background-color: var(--card-bg);
                      }
                      
                      .font-medium {
                        font-weight: 600;
                        color: ${settings.darkMode ? '#A4C2F4' : '#2E7D32'};
                        margin-right: 6px;
                      }
                      
                      .footer {
                        margin-top: 40px;
                        padding-top: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: var(--muted-color);
                        border-top: 1px solid var(--border-color);
                      }
                      
                      @media print {
                        body { padding: 0; background-color: white; }
                        button { display: none; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="technical-sheet">
                      ${previewHTML}
                      
                      <div class="footer">
                        <p>Fiche technique générée le ${new Date().toLocaleDateString(settings.locale)}</p>
                      </div>
                    </div>
                  </body>
                </html>
              `}
              className="w-full h-full border-none"
              title="Technical Sheet Preview"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TechnicalSheetButton;
