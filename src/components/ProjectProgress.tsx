
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Upload, MessageSquare, CheckCircle2, Clock, AlertCircle, Plus, FileText, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectStep {
  id: string;
  name: string;
  status: 'En attente' | 'En cours' | 'Terminé';
  startDate?: Date;
  endDate?: Date;
  description: string;
  files: string[];
  comments: Comment[];
  isCustom?: boolean;
}

interface Comment {
  id: string;
  author: string;
  message: string;
  date: Date;
  type: 'client' | 'designer';
}

interface ProjectProgressProps {
  projectId: string;
  projectName: string;
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ projectId, projectName }) => {
  const [steps, setSteps] = useState<ProjectStep[]>([
    {
      id: '1',
      name: 'Brief validé',
      status: 'Terminé',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-02'),
      description: 'Validation complète du brief client et définition des objectifs',
      files: ['brief-client.pdf', 'specifications.docx'],
      comments: [
        {
          id: '1',
          author: 'Client',
          message: 'Brief validé, parfait !',
          date: new Date('2025-06-02'),
          type: 'client'
        }
      ]
    },
    {
      id: '2',
      name: 'Concepts initiaux',
      status: 'En cours',
      startDate: new Date('2025-06-03'),
      description: 'Création des premiers concepts et propositions créatives',
      files: ['concept-1.png', 'concept-2.png'],
      comments: []
    },
    {
      id: '3',
      name: 'Révisions & Affinements',
      status: 'En attente',
      description: 'Ajustements basés sur les retours client',
      files: [],
      comments: []
    },
    {
      id: '4',
      name: 'Validation finale / Livraison',
      status: 'En attente',
      description: 'Finalisation et livraison des éléments finaux',
      files: [],
      comments: []
    }
  ]);

  const [selectedStep, setSelectedStep] = useState<ProjectStep | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');

  const getStatusIcon = (status: ProjectStep['status']) => {
    switch (status) {
      case 'Terminé':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'En cours':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'En attente':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
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
    return Math.round((completedSteps / steps.length) * 100);
  };

  const updateStepStatus = (stepId: string, newStatus: ProjectStep['status']) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updatedStep = { ...step, status: newStatus };
        if (newStatus === 'En cours' && !step.startDate) {
          updatedStep.startDate = new Date();
        }
        if (newStatus === 'Terminé' && !step.endDate) {
          updatedStep.endDate = new Date();
        }
        return updatedStep;
      }
      return step;
    }));
  };

  const addComment = (stepId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Designer',
      message: newComment,
      date: new Date(),
      type: 'designer'
    };

    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          comments: [...step.comments, comment]
        };
      }
      return step;
    }));

    setNewComment('');
  };

  const addCustomStep = () => {
    if (!newStepName.trim()) return;

    const newStep: ProjectStep = {
      id: Date.now().toString(),
      name: newStepName,
      status: 'En attente',
      description: newStepDescription,
      files: [],
      comments: [],
      isCustom: true
    };

    setSteps(prev => [...prev, newStep]);
    setNewStepName('');
    setNewStepDescription('');
    setIsAddStepOpen(false);
  };

  const removeCustomStep = (stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec progression globale */}
      <div className="glass-morphism p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{projectName}</h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-400">{calculateProgress()}%</div>
            <div className="text-purple-200 text-sm">Progression</div>
          </div>
        </div>
        
        <Progress value={calculateProgress()} className="h-3 mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {steps.filter(s => s.status === 'Terminé').length}
            </div>
            <div className="text-purple-200 text-sm">Étapes terminées</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {steps.filter(s => s.status === 'En cours').length}
            </div>
            <div className="text-purple-200 text-sm">En cours</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">
              {steps.filter(s => s.status === 'En attente').length}
            </div>
            <div className="text-purple-200 text-sm">En attente</div>
          </div>
        </div>
      </div>

      {/* Barre de progression latérale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Étapes du Projet</h3>
              <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass-morphism border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Nouvelle Étape</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Nom de l'étape</Label>
                      <Input
                        value={newStepName}
                        onChange={(e) => setNewStepName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Ex: Révision intermédiaire"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={newStepDescription}
                        onChange={(e) => setNewStepDescription(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Description de l'étape..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddStepOpen(false)}
                        className="border-white/20 text-white"
                      >
                        Annuler
                      </Button>
                      <Button onClick={addCustomStep} className="bg-green-500">
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedStep?.id === step.id 
                      ? 'bg-white/20 border-2 border-purple-400' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedStep(step)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-semibold">
                        {index + 1}
                      </div>
                      {getStatusIcon(step.status)}
                    </div>
                    {step.isCustom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomStep(step.id);
                        }}
                        className="text-red-400 hover:bg-red-500/20 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <h4 className="font-medium text-white mb-1">{step.name}</h4>
                  <Badge className={`${getStatusColor(step.status)} text-white text-xs`}>
                    {step.status}
                  </Badge>
                  {step.comments.length > 0 && (
                    <div className="mt-2 flex items-center text-purple-300 text-xs">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {step.comments.length} commentaire{step.comments.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone d'informations détaillées */}
        <div className="lg:col-span-2">
          {selectedStep ? (
            <div className="glass-morphism p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{selectedStep.name}</h3>
                  <p className="text-purple-200">{selectedStep.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={selectedStep.status === 'En attente' ? 'default' : 'outline'}
                    onClick={() => updateStepStatus(selectedStep.id, 'En attente')}
                    className="text-xs"
                  >
                    En attente
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStep.status === 'En cours' ? 'default' : 'outline'}
                    onClick={() => updateStepStatus(selectedStep.id, 'En cours')}
                    className="text-xs"
                  >
                    En cours
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStep.status === 'Terminé' ? 'default' : 'outline'}
                    onClick={() => updateStepStatus(selectedStep.id, 'Terminé')}
                    className="text-xs"
                  >
                    Terminé
                  </Button>
                </div>
              </div>

              {/* Dates */}
              {(selectedStep.startDate || selectedStep.endDate) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selectedStep.startDate && (
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-purple-200 text-sm">Date de début</div>
                      <div className="text-white font-medium">
                        {format(selectedStep.startDate, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                  {selectedStep.endDate && (
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-purple-200 text-sm">Date de fin</div>
                      <div className="text-white font-medium">
                        {format(selectedStep.endDate, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fichiers */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-medium">Fichiers</h4>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedStep.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-white text-sm">{file}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-400">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedStep.files.length === 0 && (
                    <div className="text-purple-300 text-sm text-center py-4">
                      Aucun fichier uploadé
                    </div>
                  )}
                </div>
              </div>

              {/* Commentaires */}
              <div>
                <h4 className="text-white font-medium mb-3">Commentaires</h4>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedStep.comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-lg ${
                      comment.type === 'client' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium text-sm">{comment.author}</span>
                        <span className="text-purple-300 text-xs">
                          {format(comment.date, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-white text-sm">{comment.message}</p>
                    </div>
                  ))}
                  {selectedStep.comments.length === 0 && (
                    <div className="text-purple-300 text-sm text-center py-4">
                      Aucun commentaire
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="bg-white/10 border-white/20 text-white flex-1"
                    rows={2}
                  />
                  <Button 
                    onClick={() => addComment(selectedStep.id)}
                    className="bg-green-500 hover:bg-green-600 self-end"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-morphism p-6 rounded-2xl text-center">
              <div className="text-purple-300 mb-4">
                <Clock className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Sélectionnez une étape</h3>
              <p className="text-purple-200">Cliquez sur une étape à gauche pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;
