
import React from 'react';
import { EditableField } from '../ui/editable-field';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description: string;
  onTitleChange: (value: string | number) => void;
  onDescriptionChange: (value: string | number) => void;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'centered' | 'compact';
  badge?: React.ReactNode;
  stats?: React.ReactNode;
  filterArea?: React.ReactNode;
}

const PageHeader = ({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange,
  actions,
  className = '',
  icon,
  variant = 'default',
  badge,
  stats,
  filterArea
}: PageHeaderProps) => {
  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.4
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.header 
      initial="hidden"
      animate="visible"
      variants={contentVariants}
      className={`${variant === 'centered' ? 'flex-col items-center text-center' : 
        variant === 'compact' ? 'flex-row items-center' : 
        'flex-col md:flex-row md:justify-between md:items-center'} mb-6 ${className}`}
    >
      <div className="flex flex-col space-y-2 flex-grow">
        <div className={`flex ${variant === 'compact' ? 'items-center gap-3' : 'flex-col'}`}>
          {variant === 'compact' ? (
            <div className="flex items-center gap-3">
              {icon && <span className="text-primary">{icon}</span>}
              
              <div>
                <motion.h1 variants={itemVariants} className={`text-2xl font-bold ${variant === 'compact' ? 'mb-0' : 'mb-1'}`}>
                  <EditableField
                    value={title}
                    onSave={onTitleChange}
                    className="inline-block"
                    showEditIcon
                  />
                  {badge && <span className="ml-2">{badge}</span>}
                </motion.h1>
                
                {variant === 'compact' && (
                  <motion.p variants={itemVariants} className="text-muted-foreground">
                    <EditableField
                      value={description}
                      onSave={onDescriptionChange}
                      className="inline-block"
                      showEditIcon
                    />
                  </motion.p>
                )}
              </div>
            </div>
          ) : (
            <>
              <motion.div variants={itemVariants} className="flex items-center gap-2">
                {icon && <span className="text-primary">{icon}</span>}
                <h1 className="text-2xl font-bold mb-1">
                  <EditableField
                    value={title}
                    onSave={onTitleChange}
                    className="inline-block"
                    showEditIcon
                  />
                  {badge && <span className="ml-2">{badge}</span>}
                </h1>
              </motion.div>
              
              <motion.p variants={itemVariants} className="text-muted-foreground">
                <EditableField
                  value={description}
                  onSave={onDescriptionChange}
                  className="inline-block"
                  showEditIcon
                />
              </motion.p>
            </>
          )}
        </div>
        
        {stats && <motion.div variants={itemVariants} className="mt-2">{stats}</motion.div>}
      </div>
      
      <div className="flex flex-col space-y-4 mt-4 md:mt-0">
        {actions && (
          <motion.div 
            variants={itemVariants}
            className={`flex flex-wrap items-center gap-2 ${variant === 'centered' ? 'justify-center' : 'justify-end'}`}
          >
            {actions}
          </motion.div>
        )}
        
        {filterArea && (
          <motion.div variants={itemVariants} className="w-full mt-4">
            {filterArea}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default PageHeader;
