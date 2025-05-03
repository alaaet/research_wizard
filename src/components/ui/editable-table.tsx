import React, { useState } from 'react';
import { EditableField } from './editable-field';
import { ChevronDown, Edit, Trash2, Plus } from 'lucide-react';

export interface Column {
  id: string;
  header: string;
  accessorKey: string;
  type?: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  isEditable?: boolean;
  width?: string;
}

interface EditableTableProps {
  data: Record<string, any>[];
  columns: Column[];
  onUpdate: (rowIndex: number, columnId: string, value: any) => void;
  onDelete?: (rowIndex: number) => void;
  onAdd?: (newRow: Record<string, any>) => void;
  className?: string;
  sortable?: boolean;
  actions?: { icon: React.ReactNode, label: string, onClick: (rowIndex: number) => void }[];
}

export const EditableTable = ({
  data,
  columns,
  onUpdate,
  onDelete,
  onAdd,
  className = '',
  sortable = true,
  actions = []
}: EditableTableProps) => {
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' 
      ? (aValue > bValue ? 1 : -1)
      : (aValue < bValue ? 1 : -1);
  });

  const handleAddRow = () => {
    if (onAdd) {
      const newRow = columns.reduce((acc, column) => {
        acc[column.accessorKey] = '';
        return acc;
      }, {} as Record<string, any>);
      
      onAdd(newRow);
    }
  };

  const getRowClass = (row: Record<string, any>) => {
    if (row.status === 'critical') return 'bg-red-50';
    if (row.status === 'warning') return 'bg-yellow-50';
    return '';
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Haute':
      case 'Élevée':
      case 'Urgente':
        return 'bg-red-100 text-red-800';
      case 'Moyenne':
        return 'bg-orange-100 text-orange-800';
      case 'Basse':
      case 'Faible':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.id} 
                  className={`px-4 py-3 text-left ${column.width || ''}`}
                  style={{ width: column.width }}
                >
                  {sortable ? (
                    <button 
                      className="flex items-center" 
                      onClick={() => handleSort(column.accessorKey)}
                    >
                      {column.header}
                      {sortBy === column.accessorKey && (
                        <ChevronDown 
                          className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} 
                        />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {(onDelete || actions.length > 0) && (
                <th className="px-4 py-3 text-left w-24">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={`border-t hover:bg-muted/30 ${getRowClass(row)}`}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.id}`} className="px-4 py-3">
                    {column.isEditable ? (
                      column.accessorKey === 'priority' ? (
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityStyle(row[column.accessorKey])}`}>
                          <EditableField
                            value={row[column.accessorKey]}
                            type={column.type as 'text' | 'number' | 'date' | 'select'}
                            options={column.options?.map(opt => ({ value: opt, label: opt }))}
                            onSave={(value) => onUpdate(rowIndex, column.accessorKey, value)}
                          />
                        </div>
                      ) : (
                        <EditableField
                          value={row[column.accessorKey]}
                          type={column.type as 'text' | 'number' | 'date' | 'select'}
                          options={column.options?.map(opt => ({ value: opt, label: opt }))}
                          onSave={(value) => onUpdate(rowIndex, column.accessorKey, value)}
                        />
                      )
                    ) : column.accessorKey === 'priority' ? (
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityStyle(row[column.accessorKey])}`}>
                        {row[column.accessorKey]}
                      </div>
                    ) : (
                      row[column.accessorKey]
                    )}
                  </td>
                ))}
                {(onDelete || actions.length > 0) && (
                  <td className="px-4 py-3">
                    <div className="flex space-x-1">
                      {actions.map((action, index) => (
                        <button 
                          key={index}
                          onClick={() => action.onClick(rowIndex)}
                          className="p-1.5 hover:bg-muted rounded"
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(rowIndex)}
                          className="p-1.5 hover:bg-rwiz-danger/10 text-rwiz-danger rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + ((onDelete || actions.length > 0) ? 1 : 0)} className="px-4 py-4 text-center text-muted-foreground">
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {onAdd && (
        <div className="p-4 border-t">
          <button 
            onClick={handleAddRow}
            className="flex items-center px-4 py-2 text-sm bg-rwiz-primary text-white rounded-lg hover:bg-rwiz-primary-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </button>
        </div>
      )}
    </div>
  );
};
