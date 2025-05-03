
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import NotificationCenter from './NotificationCenter';

const NotificationButton: React.FC = () => {
  const { addNotification } = useNotifications();
  
  const handleCreateTestNotification = () => {
    const types = ['info', 'success', 'warning', 'error'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    addNotification(
      `Test ${randomType}`,
      `Ceci est une notification de test de type ${randomType} créée le ${new Date().toLocaleTimeString()}`,
      randomType
    );
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={handleCreateTestNotification}>
        <Bell className="h-4 w-4 mr-2" />
        Test Notification
      </Button>
      <NotificationCenter />
    </div>
  );
};

export default NotificationButton;
