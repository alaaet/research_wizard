
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, FileSpreadsheet, FileBarChart2 } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ReportGenerationButtonProps {
  moduleName: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
  onlyFormats?: Array<'pdf' | 'excel' | 'csv'>;
  withAnimation?: boolean;
}

const ReportGenerationButton: React.FC<ReportGenerationButtonProps> = ({
  moduleName,
  className = "",
  variant = "default",
  children,
  onlyFormats,
  withAnimation = true
}) => {
  const { exportModuleData } = useCRM();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedFormat, setLastGeneratedFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const generateReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    setLastGeneratedFormat(format);
    
    try {
      await exportModuleData(moduleName, format);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Déterminer quels formats afficher
  const formats = onlyFormats || ['pdf', 'excel', 'csv'];

  const formatIcons = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: FileBarChart2
  };

  const formatLabels = {
    pdf: 'Format PDF',
    excel: 'Format Excel',
    csv: 'Format CSV'
  };

  // If we have a last generated format and it's in our available formats, put it first
  const sortedFormats = lastGeneratedFormat && formats.includes(lastGeneratedFormat)
    ? [lastGeneratedFormat, ...formats.filter(f => f !== lastGeneratedFormat)]
    : formats;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          className={className || `bg-green-600 hover:bg-green-700 text-white`}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg className={`${withAnimation ? 'animate-spin' : ''} -ml-1 mr-2 h-4 w-4 text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération...
            </>
          ) : children || (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Générer un rapport
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-fade-in">
        {sortedFormats.map(format => (
          <DropdownMenuItem 
            key={format}
            onClick={() => generateReport(format)} 
            disabled={isGenerating}
            className={`hover:bg-muted transition-colors ${lastGeneratedFormat === format ? 'font-medium' : ''}`}
          >
            {React.createElement(formatIcons[format], { className: "mr-2 h-4 w-4" })}
            <span>{formatLabels[format]}</span>
            {lastGeneratedFormat === format && (
              <span className="ml-2 text-xs text-muted-foreground">(Récent)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportGenerationButton;
