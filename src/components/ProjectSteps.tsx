
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export interface ProjectStep {
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

const STORAGE_KEY_PREFIX = 'jang-project-steps-';

const getStoredSteps = (projectId: string): ProjectStep[] | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erreur lecture étapes localStorage:', e);
  }
  return null;
};

const saveSteps = (projectId: string, steps: ProjectStep[]) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(steps));
  } catch (e) {
    console.error('Erreur sauvegarde étapes localStorage:', e);
  }
};

const ProjectSteps: React.FC<ProjectStepsProps> = ({ projectId, onProgressChange }) => {
  const [steps, setSteps] = useState<ProjectStep[]>(() => {
    // Charger depuis localStorage, sinon liste vide
    return getStoredSteps(projectId) || [];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProjectStep | null>(null);
  const [newStep, setNewStep] = useState({
    name: '',
    description: '',
    status: 'En attente' as const
  });

  const calculateProgress = useCallback((stepsData: ProjectStep[]) => {
    const completedSteps = stepsData.filter(step => step.status === 'Terminé').length;
    return stepsData.length > 0 ? Math.round((completedSteps / stepsData.length) * 100) : 0;
  }, []);

  // Ref stable pour onProgressChange (évite boucle infinie si le parent ne mémorise pas la callback)
  const onProgressChangeRef = useRef(onProgressChange);
  onProgressChangeRef.current = onProgressChange;

  // Recharger les étapes quand le projectId change (ouverture d'un autre projet)
  useEffect(() => {
    const loaded = getStoredSteps(projectId) || [];
    setSteps(loaded);
    onProgressChangeRef.current(calculateProgress(loaded));
  }, [projectId, calculateProgress]);

  // Sauvegarder dans localStorage à chaque modification des étapes
  useEffect(() => {
    saveSteps(projectId, steps);
  }, [steps, projectId]);

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

  const updateStepStatus = (stepId: string, newStatus: ProjectStep['status'], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, status: newStatus } : step
    );
    setSteps(updatedSteps);
    onProgressChange(calculateProgress(updatedSteps));
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

    const updatedSteps = [...steps, step];
    setSteps(updatedSteps);
    setNewStep({ name: '', description: '', status: 'En attente' });
    setIsAddModalOpen(false);
    onProgressChange(calculateProgress(updatedSteps));
  };

  const updateStep = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!editingStep || !editingStep.name.trim()) return;

    const updatedSteps = steps.map(step =>
      step.id === editingStep.id ? editingStep : step
    );
    setSteps(updatedSteps);
    setEditingStep(null);
    onProgressChange(calculateProgress(updatedSteps));
  };

  const deleteStep = (stepId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
      const updatedSteps = steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 })); // Réordonner
      setSteps(updatedSteps);
      onProgressChange(calculateProgress(updatedSteps));
    }
  };

  const handleEditClick = (step: ProjectStep, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingStep(step);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-white font-medium">Étapes du Projet</Label>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              type="button"
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
          <span className="text-white font-medium">{calculateProgress(steps)}%</span>
        </div>
        <Progress value={calculateProgress(steps)} className="h-3" />
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune étape définie</p>
          <p className="text-xs mt-1">Cliquez sur "+ Ajouter" pour créer des étapes</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {steps.sort((a, b) => a.order - b.order).map((step) => (
            <div key={step.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-white/50 text-sm font-medium">#{step.order}</span>
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
                    type="button"
                    onClick={(e) => handleEditClick(step, e)}
                    className="text-blue-400 hover:bg-white/10 p-1 h-8 w-8"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={(e) => deleteStep(step.id, e)}
                    className="text-red-400 hover:bg-white/10 p-1 h-8 w-8"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {step.description && (
                <p className="text-white/40 text-sm mb-2 ml-6">{step.description}</p>
              )}

              <div className="flex space-x-1 ml-6">
                <Button
                  size="sm"
                  type="button"
                  variant={step.status === 'En attente' ? 'default' : 'outline'}
                  onClick={(e) => updateStepStatus(step.id, 'En attente', e)}
                  className="text-xs h-7 px-2"
                >
                  En attente
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={step.status === 'En cours' ? 'default' : 'outline'}
                  onClick={(e) => updateStepStatus(step.id, 'En cours', e)}
                  className="text-xs h-7 px-2"
                >
                  En cours
                </Button>
                <Button
                  size="sm"
                  type="button"
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
      )}

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
