import React, { useState, useRef, useEffect } from 'react';
import { Building, Upload, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { useToast } from '../../hooks/use-toast';

const ProfilProfessionnel = () => {
  const { profile, loading, updateProfile, updateLogo } = useProfessionalProfile();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
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
          localStorage.setItem('jang_professional_profile', JSON.stringify(formDataRef.current));
        } catch (e) {
          // Best effort
        }
      }
    };
  }, []);

  const formeJuridiques = [
    'Entreprise personnelle',
    'SARL',
    'SAS',
    'Auto-entrepreneur'
  ];

  const secteursActivite = [
    'Communication & Design',
    'Développement web',
    'Consulting',
    'Formation',
    'Marketing digital',
    'Autre'
  ];

  const nombreEmployeOptions = [
    'Seul',
    '1-2',
    '3-5',
    '6-10',
    '+10'
  ];

  const handleInputChange = (field: string, value: string) => {
    hasUserEdited.current = true;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le logo doit faire moins de 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner une image (PNG, JPG, SVG)",
          variant: "destructive"
        });
        return;
      }

      updateLogo(file);
      toast({
        title: "Logo mis à jour",
        description: "Votre logo a été sauvegardé"
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      hasUserEdited.current = false;
      toast({
        title: "Profil professionnel sauvegardé",
        description: "Toutes vos modifications ont été enregistrées"
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Building className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Profil Professionnel</h1>
        </div>

        {/* Logo entreprise */}
        <div className="mb-8">
          <Label className="text-white font-medium text-lg mb-4 block">Logo entreprise</Label>
          <div className="bg-white/5 p-6 rounded-xl">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo entreprise"
                    className="w-24 h-24 rounded-lg object-contain bg-white/10 border border-white/20 p-2"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/10 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                    <Building className="w-8 h-8 text-purple-300" />
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-2 hover:bg-white/30 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 mb-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
                <p className="text-purple-200 text-sm">PNG, SVG, JPG jusqu'à 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Identité professionnelle */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Identité Professionnelle</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label className="text-white font-medium">Nom commercial *</Label>
              <Input
                value={formData.nomCommercial}
                onChange={(e) => handleInputChange('nomCommercial', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Forme juridique *</Label>
              <Select value={formData.formeJuridique} onValueChange={(value) => handleInputChange('formeJuridique', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {formeJuridiques.map((forme) => (
                    <SelectItem key={forme} value={forme} className="text-white hover:bg-gray-700">
                      {forme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-medium">Secteur d'activité *</Label>
              <Select value={formData.secteurActivite} onValueChange={(value) => handleInputChange('secteurActivite', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {secteursActivite.map((secteur) => (
                    <SelectItem key={secteur} value={secteur} className="text-white hover:bg-gray-700">
                      {secteur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-medium">Date de création</Label>
              <Input
                type="month"
                value={formData.dateCreation}
                onChange={(e) => handleInputChange('dateCreation', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div className="lg:col-span-2">
              <Label className="text-white font-medium">Nombre d'employés</Label>
              <Select value={formData.nombreEmployes} onValueChange={(value) => handleInputChange('nombreEmployes', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {nombreEmployeOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-white hover:bg-gray-700">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Adresse professionnelle */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Siège Social / Bureau</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <Label className="text-white font-medium">Adresse complète *</Label>
              <Input
                value={formData.adresseRue}
                onChange={(e) => handleInputChange('adresseRue', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                placeholder="Rue, immeuble, étage..."
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

            <div>
              <Label className="text-white font-medium">Région</Label>
              <Input
                value={formData.adresseRegion}
                onChange={(e) => handleInputChange('adresseRegion', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

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

        {/* Contact professionnel */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Contact Professionnel</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label className="text-white font-medium">Email professionnel</Label>
              <Input
                type="email"
                value={formData.emailProfessionnel}
                onChange={(e) => handleInputChange('emailProfessionnel', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Téléphone bureau</Label>
              <Input
                value={formData.telephoneBureau}
                onChange={(e) => handleInputChange('telephoneBureau', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>

            <div className="lg:col-span-2">
              <Label className="text-white font-medium">Site web</Label>
              <Input
                value={formData.siteWeb}
                onChange={(e) => handleInputChange('siteWeb', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
              />
            </div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Réseaux Sociaux</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label className="text-white font-medium">Instagram</Label>
              <Input
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                placeholder="@username"
              />
            </div>

            <div>
              <Label className="text-white font-medium">LinkedIn</Label>
              <Input
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                placeholder="nom-prenom"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Facebook</Label>
              <Input
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                placeholder="Nom de la page"
              />
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

export default ProfilProfessionnel;
