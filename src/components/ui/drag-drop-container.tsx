
import React, { useState } from 'react';

interface DragDropContainerProps {
  items: React.ReactNode[];
  onReorder?: (startIndex: number, endIndex: number) => void;
  className?: string;
  itemClassName?: string;
}

export const DragDropContainer = ({
  items,
  onReorder,
  className = '',
  itemClassName = ''
}: DragDropContainerProps) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      if (onReorder) {
        onReorder(draggedItem, dragOverItem);
      }
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className={`grid gap-4 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className={`
            p-4 border rounded-lg cursor-move transition-all
            ${draggedItem === index ? 'opacity-50' : 'opacity-100'}
            ${dragOverItem === index ? 'border-primary border-2' : 'border-border'}
            ${itemClassName}
          `}
        >
          {item}
        </div>
      ))}
    </div>
  );
};
