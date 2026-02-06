import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Users } from 'lucide-react';
import { useClients, ClientLegacy } from '../../hooks/useClients';
import { toast } from '../ui/use-toast';

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: (clientId: string) => void;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ open, onOpenChange, onClientCreated }) => {
  const { addClient } = useClients();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'Particulier' as 'Particulier' | 'Entreprise',
    address: '',
    city: '',
    status: 'Prospect' as 'Actif' | 'Inactif' | 'Prospect',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise';
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
      const newClient = addClient(formData);
      
      toast({
        title: "Client ajouté avec succès !",
        description: `${newClient.name} a été ajouté à votre base de données.`,
        variant: "default"
      });

      // Call the callback if provided
      if (onClientCreated) {
        onClientCreated(newClient.id);
      }

      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        type: 'Particulier',
        address: '',
        city: '',
        status: 'Prospect',
        notes: ''
      });
      setErrors({});
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client. Veuillez réessayer.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-morphism border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Nouveau Client
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Ajoutez un nouveau client à votre base de données
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Nom complet *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="John Doe"
                required
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <Label className="text-white">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="john@example.com"
                required
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Téléphone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="+221 77 123 45 67"
                required
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>
            
            <div>
              <Label className="text-white">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Particulier" className="text-white">Particulier</SelectItem>
                  <SelectItem value="Entreprise" className="text-white">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Entreprise</Label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Nom de l'entreprise"
              />
            </div>
            
            <div>
              <Label className="text-white">Ville *</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Dakar, Thiès..."
                required
              />
              {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
            </div>
          </div>

          <div>
            <Label className="text-white">Adresse</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Adresse complète..."
              rows={2}
            />
          </div>

          <div>
            <Label className="text-white">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Notes sur le client..."
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
              className="bg-gradient-to-r from-green-500 to-emerald-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter le Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewClientModal;
