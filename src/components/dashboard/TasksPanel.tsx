
import React, { useState } from 'react';
import { Edit, Trash2, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Task {
  id: number;
  title: string;
  due: string;
  priority: string;
}

interface TasksPanelProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TasksPanel: React.FC<TasksPanelProps> = ({ tasks, setTasks }) => {
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    due: '',
    priority: 'medium'
  });
  
  // Task editing
  const handleEditTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setEditedTaskTitle(task.title);
    }
  };
  
  const handleSaveTask = (taskId: number) => {
    if (editedTaskTitle.trim() === '') return;
    
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, title: editedTaskTitle } : task
    ));
    setEditingTask(null);
    toast.success('Tâche mise à jour');
  };
  
  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success('Tâche supprimée');
  };
  
  // Add new task
  const handleAddTask = () => {
    if (!newTask.title.trim() || !newTask.due.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
    const taskToAdd = {
      id: newId,
      ...newTask
    };
    
    setTasks([...tasks, taskToAdd]);
    setShowAddTaskDialog(false);
    setNewTask({
      title: '',
      due: '',
      priority: 'medium'
    });
    
    toast.success('Nouvelle tâche ajoutée');
  };
  
  return (
    <div className="dashboard-card card-hover animate-enter">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Tâches à venir</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowAddTaskDialog(true)}
            className="text-xs text-rwiz-primary hover:bg-rwiz-primary/10"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div 
              className={`w-2 h-2 rounded-full mr-3 ${
                task.priority === 'high' 
                  ? 'bg-rwiz-danger' 
                  : task.priority === 'medium' 
                    ? 'bg-rwiz-warning' 
                    : 'bg-rwiz-success'
              }`}
            />
            <div className="flex-1">
              {editingTask === task.id ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editedTaskTitle}
                    onChange={(e) => setEditedTaskTitle(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleSaveTask(task.id)}
                    className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setEditingTask(null)}
                    className="ml-1 p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Échéance: {task.due}</p>
                </>
              )}
            </div>
            <div className="flex">
              {editingTask !== task.id && (
                <>
                  <button 
                    className="p-1.5 hover:bg-muted rounded" 
                    onClick={() => handleEditTask(task.id)}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button 
                    className="p-1.5 hover:bg-muted rounded text-red-500" 
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Aucune tâche à venir</p>
        )}
      </div>
      
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une tâche</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskTitle" className="text-right">
                Titre
              </Label>
              <Input
                id="taskTitle"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Titre de la tâche"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Échéance
              </Label>
              <Input
                id="dueDate"
                value={newTask.due}
                onChange={(e) => setNewTask({...newTask, due: e.target.value})}
                placeholder="ex: Aujourd'hui, Demain, 15/06"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priorité
              </Label>
              <select
                id="priority"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTask}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPanel;
