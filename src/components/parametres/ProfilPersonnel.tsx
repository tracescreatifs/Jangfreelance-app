
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../hooks/use-toast';

const ProfilPersonnel = () => {
  const { profile, loading, updateProfile, addSpecialite, removeSpecialite, updatePhoto } = useUserProfile();
  const { toast } = useToast();
  const [newSpecialite, setNewSpecialite] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // État local pour l'édition
  const [formData, setFormData] = useState(profile);
  const hasUserEdited = useRef(false);
  const formDataRef = useRef(formData);

  // Garder formDataRef à jour
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Synchroniser avec les données du hook quand elles arrivent
  // (mais seulement si l'utilisateur n'a pas encore commencé à éditer)
  useEffect(() => {
    if (!hasUserEdited.current) {
      setFormData(profile);
    }
  }, [profile]);

  // Sauvegarder dans localStorage à la fermeture du composant
  useEffect(() => {
    return () => {
      if (hasUserEdited.current) {
        try {
          localStorage.setItem('jang_user_profile', JSON.stringify(formDataRef.current));
        } catch (e) {
          // Best effort
        }
      }
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    hasUserEdited.current = true;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La photo doit faire moins de 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner une image (PNG, JPG, JPEG)",
          variant: "destructive"
        });
        return;
      }

      updatePhoto(file);
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été sauvegardée"
      });
    }
  };

  const handleAddSpecialite = async () => {
    if (newSpecialite.trim()) {
      await addSpecialite(newSpecialite.trim());
      setNewSpecialite('');
      toast({
        title: "Spécialité ajoutée",
        description: `"${newSpecialite}" a été ajouté à vos spécialités`
      });
    }
  };

  const handleRemoveSpecialite = async (index: number, specialite: string) => {
    await removeSpecialite(index);
    toast({
      title: "Spécialité supprimée",
      description: `"${specialite}" a été retiré de vos spécialités`
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      hasUserEdited.current = false;
      toast({
        title: "Profil sauvegardé",
        description: "Toutes vos modifications ont été enregistrées avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    hasUserEdited.current = false;
  };

  const getInitials = () => {
    return `${formData.prenom.charAt(0)}${formData.nom.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-4 sm:p-6 lg:p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Profil Personnel</h1>
        </div>

        {/* Photo de profil */}
        <div className="mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt="Photo de profil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-2 hover:bg-white/30 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                Changer photo
              </Button>
              <p className="text-purple-200 text-sm mt-2">PNG, JPG jusqu'à 5MB</p>
            </div>
          </div>
        </div>

        {/* Informations de base */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Prénom *</Label>
              <Input
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Nom *</Label>
              <Input
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Email principal *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Téléphone *</Label>
              <Input
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Date de naissance</Label>
              <Input
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Rue</Label>
              <Input
                value={formData.adresseRue}
                onChange={(e) => handleInputChange('adresseRue', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Ville</Label>
              <Input
                value={formData.adresseVille}
                onChange={(e) => handleInputChange('adresseVille', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-medium">Code postal</Label>
                <Input
                  value={formData.adresseCodePostal}
                  onChange={(e) => handleInputChange('adresseCodePostal', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>
              <div>
                <Label className="text-white font-medium">Pays</Label>
                <Input
                  value={formData.adressePays}
                  onChange={(e) => handleInputChange('adressePays', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio professionnelle */}
        <div className="mb-8">
          <Label className="text-white font-medium text-lg mb-4 block">Bio professionnelle</Label>
          <div className="bg-white/5 p-6 rounded-xl">
            <div className="mb-4">
              <Label className="text-white font-medium">Présentation (500 caractères max)</Label>
              <Textarea
                value={formData.bioDescription}
                onChange={(e) => handleInputChange('bioDescription', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200 min-h-24"
                placeholder="Décrivez votre expertise et votre approche..."
                maxLength={500}
              />
              <p className="text-purple-200 text-sm mt-1">{formData.bioDescription.length}/500</p>
            </div>

            <div>
              <Label className="text-white font-medium">Spécialités</Label>
              <div className="space-y-3 mt-2">
                <div className="flex flex-wrap gap-2">
                  {profile.specialites.map((specialite, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white px-3 py-1 rounded-full text-sm border border-white/20 flex items-center gap-2"
                    >
                      • {specialite}
                      <button
                        onClick={() => handleRemoveSpecialite(index, specialite)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newSpecialite}
                    onChange={(e) => setNewSpecialite(e.target.value)}
                    placeholder="Ajouter une spécialité..."
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialite()}
                  />
                  <Button
                    onClick={handleAddSpecialite}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                    disabled={!newSpecialite.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleCancel}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilPersonnel;
