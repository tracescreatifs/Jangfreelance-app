
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProjectStep {
  id: string;
  name: string;
  description: string;
  status: 'En attente' | 'En cours' | 'Terminé';
  order: number;
}

interface ProjectStepsProps {
  projectId: string;
  onProgressChange: (progress: number) => void;
}

const ProjectSteps: React.FC<ProjectStepsProps> = ({ projectId, onProgressChange }) => {
  const [steps, setSteps] = useState<ProjectStep[]>([
    {
      id: '1',
      name: 'Brief validé',
      description: 'Validation du brief et des objectifs',
      status: 'Terminé',
      order: 1
    },
    {
      id: '2',
      name: 'Proposition initiale',
      description: 'Création des premiers concepts',
      status: 'En cours',
      order: 2
    },
    {
      id: '3',
      name: 'Révisions',
      description: 'Ajustements selon les retours',
      status: 'En attente',
      order: 3
    },
    {
      id: '4',
      name: 'Livraison finale',
      description: 'Finalisation et livraison',
      status: 'En attente',
      order: 4
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProjectStep | null>(null);
  const [newStep, setNewStep] = useState({
    name: '',
    description: '',
    status: 'En attente' as const
  });

  const getStatusIcon = (status: ProjectStep['status']) => {
    switch (status) {
      case 'Terminé':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'En cours':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'En attente':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ProjectStep['status']) => {
    switch (status) {
      case 'Terminé':
        return 'bg-green-500';
      case 'En cours':
        return 'bg-blue-500';
      case 'En attente':
        return 'bg-gray-400';
    }
  };

  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'Terminé').length;
    return steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  };

  const updateStepStatus = (stepId: string, newStatus: ProjectStep['status'], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    ));
    
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    );
    const completedCount = updatedSteps.filter(s => s.status === 'Terminé').length;
    const progress = updatedSteps.length > 0 ? Math.round((completedCount / updatedSteps.length) * 100) : 0;
    onProgressChange(progress);
  };

  const addStep = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!newStep.name.trim()) return;

    const step: ProjectStep = {
      id: Date.now().toString(),
      name: newStep.name,
      description: newStep.description,
      status: newStep.status,
      order: steps.length + 1
    };

    setSteps(prev => [...prev, step]);
    setNewStep({ name: '', description: '', status: 'En attente' });
    setIsAddModalOpen(false);
    
    const updatedSteps = [...steps, step];
    const completedCount = updatedSteps.filter(s => s.status === 'Terminé').length;
    const progress = Math.round((completedCount / updatedSteps.length) * 100);
    onProgressChange(progress);
  };

  const updateStep = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!editingStep || !editingStep.name.trim()) return;

    setSteps(prev => prev.map(step => 
      step.id === editingStep.id ? editingStep : step
    ));
    setEditingStep(null);
    
    const updatedSteps = steps.map(step => 
      step.id === editingStep.id ? editingStep : step
    );
    const completedCount = updatedSteps.filter(s => s.status === 'Terminé').length;
    const progress = Math.round((completedCount / updatedSteps.length) * 100);
    onProgressChange(progress);
  };

  const deleteStep = (stepId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
      setSteps(prev => prev.filter(step => step.id !== stepId));
      
      const updatedSteps = steps.filter(step => step.id !== stepId);
      const completedCount = updatedSteps.filter(s => s.status === 'Terminé').length;
      const progress = updatedSteps.length > 0 ? Math.round((completedCount / updatedSteps.length) * 100) : 0;
      onProgressChange(progress);
    }
  };

  const handleEditClick = (step: ProjectStep, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingStep(step);
  };

  React.useEffect(() => {
    onProgressChange(calculateProgress());
  }, [steps, onProgressChange]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-white font-medium">Étapes du Projet</Label>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md glass-morphism border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Nouvelle Étape</DialogTitle>
            </DialogHeader>
            <form onSubmit={addStep} className="space-y-4">
              <div>
                <Label className="text-white">Nom de l'étape</Label>
                <Input
                  value={newStep.name}
                  onChange={(e) => setNewStep(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  placeholder="Ex: Révision intermédiaire"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={newStep.description}
                  onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  placeholder="Description de l'étape..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-white">Statut initial</Label>
                <Select value={newStep.status} onValueChange={(value: any) => setNewStep(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800/95 border-gray-600 backdrop-blur-md">
                    <SelectItem value="En attente" className="text-white hover:bg-white/10">En attente</SelectItem>
                    <SelectItem value="En cours" className="text-white hover:bg-white/10">En cours</SelectItem>
                    <SelectItem value="Terminé" className="text-white hover:bg-white/10">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                  Ajouter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-white text-sm">Progression générale</span>
          <span className="text-white font-medium">{calculateProgress()}%</span>
        </div>
        <Progress value={calculateProgress()} className="h-3" />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {steps.sort((a, b) => a.order - b.order).map((step) => (
          <div key={step.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-purple-300 text-sm font-medium">#{step.order}</span>
                {getStatusIcon(step.status)}
                <span className="text-white font-medium">{step.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge className={`${getStatusColor(step.status)} text-white text-xs`}>
                  {step.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleEditClick(step, e)}
                  className="text-blue-400 hover:bg-white/10 p-1 h-8 w-8"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => deleteStep(step.id, e)}
                  className="text-red-400 hover:bg-white/10 p-1 h-8 w-8"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {step.description && (
              <p className="text-purple-200 text-sm mb-2 ml-6">{step.description}</p>
            )}

            <div className="flex space-x-1 ml-6">
              <Button
                size="sm"
                variant={step.status === 'En attente' ? 'default' : 'outline'}
                onClick={(e) => updateStepStatus(step.id, 'En attente', e)}
                className="text-xs h-7 px-2"
              >
                En attente
              </Button>
              <Button
                size="sm"
                variant={step.status === 'En cours' ? 'default' : 'outline'}
                onClick={(e) => updateStepStatus(step.id, 'En cours', e)}
                className="text-xs h-7 px-2"
              >
                En cours
              </Button>
              <Button
                size="sm"
                variant={step.status === 'Terminé' ? 'default' : 'outline'}
                onClick={(e) => updateStepStatus(step.id, 'Terminé', e)}
                className="text-xs h-7 px-2"
              >
                Terminé
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <DialogContent className="max-w-md glass-morphism border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier l'Étape</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <form onSubmit={updateStep} className="space-y-4">
              <div>
                <Label className="text-white">Nom de l'étape</Label>
                <Input
                  value={editingStep.name}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={editingStep.description}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-white">Statut</Label>
                <Select 
                  value={editingStep.status} 
                  onValueChange={(value: any) => setEditingStep(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800/95 border-gray-600 backdrop-blur-md">
                    <SelectItem value="En attente" className="text-white hover:bg-white/10">En attente</SelectItem>
                    <SelectItem value="En cours" className="text-white hover:bg-white/10">En cours</SelectItem>
                    <SelectItem value="Terminé" className="text-white hover:bg-white/10">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setEditingStep(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  Sauvegarder
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectSteps;
