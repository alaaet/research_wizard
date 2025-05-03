
import React, { useState } from 'react';
import { AlertTriangle, Trash2, Edit, X, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EditableField } from '../ui/editable-field';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Alert {
  id: number;
  message: string;
  type: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  setAlertsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, setAlerts, setAlertsCount }) => {
  const [showAddAlertDialog, setShowAddAlertDialog] = useState(false);
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertType, setNewAlertType] = useState('warning');
  
  // Edit alert
  const handleEditAlert = (id: number, message: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, message } : alert
    ));
    toast.success('Alerte mise à jour');
  };
  
  // Delete alert
  const handleDeleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    setAlertsCount(prev => prev - 1);
    toast.success('Alerte supprimée');
  };
  
  // Add new alert
  const handleAddAlert = () => {
    if (!newAlertMessage.trim()) {
      toast.error('Veuillez saisir un message pour l\'alerte');
      return;
    }
    
    const newId = Math.max(...alerts.map(a => a.id), 0) + 1;
    const newAlert = {
      id: newId,
      message: newAlertMessage,
      type: newAlertType
    };
    
    setAlerts([...alerts, newAlert]);
    setAlertsCount(prev => prev + 1);
    setNewAlertMessage('');
    setShowAddAlertDialog(false);
    toast.success('Nouvelle alerte ajoutée');
  };
  
  return (
    <div className="dashboard-card card-hover animate-enter">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Alertes</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowAddAlertDialog(true)}
            className="text-xs text-rwiz-primary hover:bg-rwiz-primary/10"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg ${
              alert.type === 'danger' 
                ? 'bg-rwiz-danger/10 border-l-4 border-rwiz-danger' 
                : alert.type === 'warning' 
                  ? 'bg-rwiz-warning/10 border-l-4 border-rwiz-warning' 
                  : 'bg-rwiz-info/10 border-l-4 border-rwiz-info'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <AlertTriangle className={`h-5 w-5 mr-2 ${
                  alert.type === 'danger' 
                    ? 'text-rwiz-danger' 
                    : alert.type === 'warning' 
                      ? 'text-rwiz-warning' 
                      : 'text-rwiz-info'
                }`} />
                <EditableField 
                  value={alert.message} 
                  onSave={(value) => handleEditAlert(alert.id, String(value))}
                  className="text-sm"
                />
              </div>
              <button 
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Aucune alerte active</p>
        )}
      </div>
      
      <Dialog open={showAddAlertDialog} onOpenChange={setShowAddAlertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une alerte</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertType" className="text-right">
                Type
              </Label>
              <select
                id="alertType"
                value={newAlertType}
                onChange={(e) => setNewAlertType(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="info">Information</option>
                <option value="warning">Avertissement</option>
                <option value="danger">Danger</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Input
                id="message"
                value={newAlertMessage}
                onChange={(e) => setNewAlertMessage(e.target.value)}
                placeholder="Entrez le message de l'alerte"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlertDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddAlert}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertsPanel;
