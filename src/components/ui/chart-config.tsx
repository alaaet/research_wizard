
import React, { useState } from 'react';
import { Settings, X, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { EditableField } from './editable-field';

interface ChartConfigProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  chartOptions?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    chartColors?: string[];
  };
  onOptionsChange?: (options: any) => void;
  className?: string;
}

export const ChartConfig = ({
  title,
  description,
  children,
  onTitleChange,
  onDescriptionChange,
  chartOptions,
  onOptionsChange,
  className = ''
}: ChartConfigProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [currentOptions, setCurrentOptions] = useState(chartOptions || {
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    chartColors: ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0']
  });

  const handleOptionChange = (key: string, value: any) => {
    const newOptions = { ...currentOptions, [key]: value };
    setCurrentOptions(newOptions);
    if (onOptionsChange) {
      onOptionsChange(newOptions);
    }
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...(currentOptions.chartColors || [])];
    newColors[index] = color;
    handleOptionChange('chartColors', newColors);
  };

  return (
    <div className={`bg-white rounded-xl border overflow-hidden relative ${className}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          {onTitleChange ? (
            <EditableField
              value={title}
              onSave={onTitleChange}
              className="text-lg font-medium"
            />
          ) : (
            <h3 className="text-lg font-medium">{title}</h3>
          )}
          
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {onDescriptionChange ? (
                <EditableField
                  value={description}
                  onSave={onDescriptionChange}
                />
              ) : (
                description
              )}
            </div>
          )}
        </div>
        
        {onOptionsChange && (
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      <div className="relative">
        {children}
        
        {showConfig && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm p-4 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Configuration du graphique</h4>
              <button 
                onClick={() => setShowConfig(false)}
                className="p-1.5 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <EditableField
                  value={title}
                  onSave={(value) => onTitleChange && onTitleChange(value.toString())}
                  className="w-full border rounded-md"
                />
              </div>
              
              {description !== undefined && (
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <EditableField
                    value={description}
                    onSave={(value) => onDescriptionChange && onDescriptionChange(value.toString())}
                    className="w-full border rounded-md"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium mb-1">
                    <input 
                      type="checkbox" 
                      checked={currentOptions.showLegend} 
                      onChange={(e) => handleOptionChange('showLegend', e.target.checked)}
                      className="mr-2"
                    />
                    Afficher la légende
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1">
                    <input 
                      type="checkbox" 
                      checked={currentOptions.showGrid} 
                      onChange={(e) => handleOptionChange('showGrid', e.target.checked)}
                      className="mr-2"
                    />
                    Afficher la grille
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1">
                    <input 
                      type="checkbox" 
                      checked={currentOptions.showTooltip} 
                      onChange={(e) => handleOptionChange('showTooltip', e.target.checked)}
                      className="mr-2"
                    />
                    Afficher les infobulles
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Couleurs du graphique</label>
                <div className="flex flex-wrap gap-2">
                  {currentOptions.chartColors?.map((color, index) => (
                    <div key={index} className="relative">
                      <input 
                        type="color" 
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 pt-2 border-t">
              <button 
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 bg-rwiz-primary text-white rounded-lg flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
