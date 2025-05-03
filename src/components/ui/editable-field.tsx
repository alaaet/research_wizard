
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';

interface EditableFieldProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number' | 'date' | 'select';
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onClick?: (e: React.MouseEvent) => void;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
  showEditIcon?: boolean;
}

export const EditableField = ({
  value,
  onSave,
  type = 'text',
  className = '',
  inputClassName = '',
  placeholder = 'Entrer une valeur...',
  onClick,
  options = [],
  icon,
  showEditIcon = false
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update the input value when the passed value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSave = () => {
    // For number type, convert string to number
    const processedValue = type === 'number' ? 
      (inputValue === '' ? 0 : Number(inputValue)) : 
      inputValue;
    
    onSave(processedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const formatValue = (val: string | number) => {
    if (type === 'date' && typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } else if (type === 'select' && typeof val === 'string') {
      const option = options.find(opt => opt.value === val);
      return option ? option.label : val;
    }
    
    return val;
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {type === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={inputValue as string}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`px-2 py-1 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none ${inputClassName}`}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`px-2 py-1 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none ${inputClassName}`}
            placeholder={placeholder}
          />
        )}
        <div className="flex items-center">
          <button 
            onClick={handleSave} 
            className="p-1 text-rwiz-success hover:bg-rwiz-success/10 rounded-full"
            aria-label="Enregistrer"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={handleCancel} 
            className="p-1 text-rwiz-danger hover:bg-rwiz-danger/10 rounded-full"
            aria-label="Annuler"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group cursor-pointer hover:bg-muted/30 px-2 py-1 rounded flex items-center justify-between ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>
          {value ? formatValue(value) : (
            <span className="text-muted-foreground italic">{placeholder}</span>
          )}
        </span>
      </div>
      {showEditIcon && (
        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};
