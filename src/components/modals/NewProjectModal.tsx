
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Plus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import NewClientModal from './NewClientModal';
import { toast } from '../ui/use-toast';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ open, onOpenChange }) => {
  const { clients, updateClient, refreshClients } = useClients();
  const { addProject } = useProjects();
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    type: '',
    budget: '',
    deadline: undefined as Date | undefined,
    description: '',
    priority: 'Moyenne' as 'Haute' | 'Moyenne' | 'Basse'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectTypes = [
    'Site Web',
    'Application Mobile',
    'Logo & Identité',
    'E-commerce',
    'Consultation',
    'Maintenance'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du projet est requis';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Veuillez sélectionner un client';
    }

    if (!formData.type) {
      newErrors.type = 'Veuillez sélectionner un type de projet';
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Le budget doit être supérieur à 0';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'La date d\'échéance est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      
      if (!selectedClient) {
        throw new Error('Client non trouvé');
      }

      const newProject = await addProject({
        name: formData.name,
        clientId: formData.clientId,
        clientName: `${selectedClient.name} - ${selectedClient.company}`,
        type: formData.type,
        status: 'En cours',
        priority: formData.priority,
        progress: 0,
        budget: parseFloat(formData.budget),
        spent: 0,
        deadline: formData.deadline!.toISOString().split('T')[0],
        description: formData.description
      });

      // Mettre à jour le nombre de projets du client
      await updateClient(formData.clientId, {
        projects: selectedClient.projects + 1,
        lastContact: new Date().toISOString().split('T')[0]
      });

      toast({
        title: "Projet créé avec succès !",
        description: `Le projet "${newProject.name}" a été ajouté.`,
        variant: "default"
      });

      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        clientId: '',
        type: '',
        budget: '',
        deadline: undefined,
        description: '',
        priority: 'Moyenne'
      });
      setErrors({});
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleNewClientCreated = async (clientId: string) => {
    await refreshClients();
    setFormData(prev => ({ ...prev, clientId }));
    setIsNewClientModalOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] glass-morphism border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Projet
            </DialogTitle>
            <DialogDescription className="text-purple-200">
              Créez un nouveau projet pour votre portefeuille
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Nom du projet *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Ex: Site Restaurant"
                  required
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label className="text-white">Client *</Label>
                <div className="flex gap-2">
                  <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white flex-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id} className="text-white">
                          {client.name} - {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 px-3"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                {errors.clientId && <p className="text-red-400 text-sm mt-1">{errors.clientId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Type de projet *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {projectTypes.map(type => (
                      <SelectItem key={type} value={type} className="text-white">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
              </div>
              
              <div>
                <Label className="text-white">Budget (CFA) *</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="500000"
                  required
                />
                {errors.budget && <p className="text-red-400 text-sm mt-1">{errors.budget}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Date limite *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/10 border-white/20 text-white justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "dd/MM/yyyy") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => handleInputChange('deadline', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.deadline && <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>}
              </div>
              
              <div>
                <Label className="text-white">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Basse" className="text-white">Basse</SelectItem>
                    <SelectItem value="Moyenne" className="text-white">Moyenne</SelectItem>
                    <SelectItem value="Haute" className="text-white">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Description du projet..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-white/20 text-white"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-500 to-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création en cours...' : 'Créer le Projet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NewClientModal
        open={isNewClientModalOpen}
        onOpenChange={setIsNewClientModalOpen}
        onClientCreated={handleNewClientCreated}
      />
    </>
  );
};

export default NewProjectModal;
