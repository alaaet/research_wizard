
import React, { ReactNode } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface PreviewContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ 
  children, 
  title,
  subtitle
}) => {
  const { settings } = useAppSettings();
  
  return (
    <div 
      className={`preview-container rounded-lg shadow-sm overflow-hidden ${
        settings.darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}
      role="region"
      aria-label={title || "Content preview"}
    >
      {(title || subtitle) && (
        <header className={`preview-header p-6 border-b ${
          settings.darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {title && <h1 className="text-2xl font-bold mb-1">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </header>
      )}
      <div className="preview-content p-6">
        {children}
      </div>
      <footer className={`preview-footer p-6 border-t ${
        settings.darkMode ? 'border-gray-800' : 'border-gray-200'
      } text-right text-sm text-muted-foreground`}>
        <p>Date: {new Date().toLocaleDateString(settings.locale)}</p>
      </footer>
    </div>
  );
};

export default PreviewContainer;
