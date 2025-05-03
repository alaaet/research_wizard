
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Printer, FileText, Loader2, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PreviewDialog from './PreviewDialog';
import { usePreviewActions } from '@/hooks/use-preview-actions';

interface PreviewPrintButtonProps {
  data: any[];
  moduleName: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showPreview?: boolean;
  columns?: { key: string, header: string }[];
  title?: string;
}

const PreviewPrintButton: React.FC<PreviewPrintButtonProps> = ({
  data,
  moduleName,
  className = "",
  variant = "outline",
  showPreview = true,
  columns,
  title
}) => {
  const {
    isActionInProgress,
    previewOpen,
    setPreviewOpen,
    previewHTML,
    handlePrint,
    handleShowPreview,
    handleExportPDF
  } = usePreviewActions({ data, moduleName, columns, title });

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={variant} 
                  size="sm"
                  className={`transition-all ${className}`}
                  disabled={isActionInProgress}
                  aria-label="Options d'aperçu et d'impression"
                >
                  {isActionInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="ml-2 hidden sm:inline">Aperçu</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aperçu et impression</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-56">
          {showPreview && (
            <DropdownMenuItem 
              onClick={handleShowPreview} 
              className="cursor-pointer"
              onKeyDown={(e) => handleKeyDown(e, handleShowPreview)}
            >
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Aperçu à l'écran</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={handlePrint} 
            className="cursor-pointer"
            onKeyDown={(e) => handleKeyDown(e, handlePrint)}
          >
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Imprimer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleExportPDF} 
            className="cursor-pointer"
            onKeyDown={(e) => handleKeyDown(e, handleExportPDF)}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Exporter en PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        moduleName={moduleName}
        previewHTML={previewHTML}
        onPrint={handlePrint}
      />
    </>
  );
};

export default PreviewPrintButton;
