import React, { useState } from 'react';
import { Globe, MapPin, Clock, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const Localisation = () => {
  const [settings, setSettings] = useState({
    langue: 'fr',
    pays: 'SN',
    fuseau: 'Africa/Dakar',
    devise: 'XOF',
    formatDate: 'dd/MM/yyyy',
    formatHeure: '24h',
    premierJour: '1', // Lundi
    separateurDecimal: ',',
    separateurMilliers: ' ',
  });

  const langues = [
    { code: 'fr', nom: 'Français', flag: '🇫🇷' },
    { code: 'en', nom: 'English', flag: '🇺🇸' },
    { code: 'wo', nom: 'Wolof', flag: '🇸🇳' },
    { code: 'ar', nom: 'العربية', flag: '🇸🇦' },
  ];

  const pays = [
    { code: 'SN', nom: 'Sénégal', flag: '🇸🇳', devise: 'XOF', fuseau: 'Africa/Dakar' },
    { code: 'CI', nom: 'Côte d\'Ivoire', flag: '🇨🇮', devise: 'XOF', fuseau: 'Africa/Abidjan' },
    { code: 'ML', nom: 'Mali', flag: '🇲🇱', devise: 'XOF', fuseau: 'Africa/Bamako' },
    { code: 'BF', nom: 'Burkina Faso', flag: '🇧🇫', devise: 'XOF', fuseau: 'Africa/Ouagadougou' },
    { code: 'CM', nom: 'Cameroun', flag: '🇨🇲', devise: 'XAF', fuseau: 'Africa/Douala' },
    { code: 'FR', nom: 'France', flag: '🇫🇷', devise: 'EUR', fuseau: 'Europe/Paris' },
  ];

  const devises = [
    { code: 'XOF', nom: 'Franc CFA (BCEAO)', symbole: 'CFA', exemple: '1 000 CFA' },
    { code: 'XAF', nom: 'Franc CFA (BEAC)', symbole: 'FCFA', exemple: '1 000 FCFA' },
    { code: 'EUR', nom: 'Euro', symbole: '€', exemple: '1 000 €' },
    { code: 'USD', nom: 'Dollar américain', symbole: '$', exemple: '$1,000' },
  ];

  const formatsDate = [
    { value: 'dd/MM/yyyy', label: '31/12/2024', description: 'Format français' },
    { value: 'MM/dd/yyyy', label: '12/31/2024', description: 'Format américain' },
    { value: 'yyyy-MM-dd', label: '2024-12-31', description: 'Format ISO' },
    { value: 'dd.MM.yyyy', label: '31.12.2024', description: 'Format allemand' },
  ];

  const joursDebut = [
    { value: '0', label: 'Dimanche' },
    { value: '1', label: 'Lundi' },
    { value: '6', label: 'Samedi' },
  ];

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Auto-ajustement quand on change de pays
      if (key === 'pays') {
        const selectedCountry = pays.find(p => p.code === value);
        if (selectedCountry) {
          newSettings.devise = selectedCountry.devise;
          newSettings.fuseau = selectedCountry.fuseau;
        }
      }
      
      return newSettings;
    });
  };

  const getCurrentCountry = () => pays.find(p => p.code === settings.pays);
  const getCurrentDevise = () => devises.find(d => d.code === settings.devise);

  const formatExampleNumber = (amount: number) => {
    const devise = getCurrentDevise();
    const separatorMap: { [key: string]: string } = {
      ',': ',',
      '.': '.',
    };
    const thousandMap: { [key: string]: string } = {
      ' ': ' ',
      ',': ',',
      '.': '.',
    };
    
    const formatted = amount.toString()
      .replace('.', separatorMap[settings.separateurDecimal] || '.')
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousandMap[settings.separateurMilliers] || ' ');
    
    return `${formatted} ${devise?.symbole || ''}`;
  };

  const handleSave = () => {
    console.log('Sauvegarde paramètres localisation:', settings);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Globe className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Localisation</h1>
        </div>

        <div className="space-y-8">
          {/* Langue et région */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Langue et région
              </CardTitle>
              <CardDescription className="text-purple-200">
                Définissez votre langue et votre pays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Langue de l'interface</Label>
                  <Select value={settings.langue} onValueChange={(value) => handleSettingChange('langue', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {langues.map((langue) => (
                        <SelectItem key={langue.code} value={langue.code} className="text-white hover:bg-gray-700">
                          {langue.flag} {langue.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Pays/Région</Label>
                  <Select value={settings.pays} onValueChange={(value) => handleSettingChange('pays', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {pays.map((country) => (
                        <SelectItem key={country.code} value={country.code} className="text-white hover:bg-gray-700">
                          {country.flag} {country.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white font-medium">Fuseau horaire</Label>
                <Select value={settings.fuseau} onValueChange={(value) => handleSettingChange('fuseau', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {pays.map((country) => (
                      <SelectItem key={country.fuseau} value={country.fuseau} className="text-white hover:bg-gray-700">
                        {country.flag} {country.fuseau.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-purple-200 text-sm mt-1">
                  Heure locale: {new Date().toLocaleString('fr-FR', { timeZone: settings.fuseau })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Devise et formats numériques */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Devise et formats numériques
              </CardTitle>
              <CardDescription className="text-purple-200">
                Configurez l'affichage des montants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white font-medium">Devise principale</Label>
                <Select value={settings.devise} onValueChange={(value) => handleSettingChange('devise', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {devises.map((devise) => (
                      <SelectItem key={devise.code} value={devise.code} className="text-white hover:bg-gray-700">
                        {devise.nom} ({devise.symbole})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-purple-200 text-sm mt-1">
                  Exemple: {getCurrentDevise()?.exemple}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Séparateur décimal</Label>
                  <Select value={settings.separateurDecimal} onValueChange={(value) => handleSettingChange('separateurDecimal', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="," className="text-white hover:bg-gray-700">Virgule ( , )</SelectItem>
                      <SelectItem value="." className="text-white hover:bg-gray-700">Point ( . )</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Séparateur des milliers</Label>
                  <Select value={settings.separateurMilliers} onValueChange={(value) => handleSettingChange('separateurMilliers', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value=" " className="text-white hover:bg-gray-700">Espace</SelectItem>
                      <SelectItem value="," className="text-white hover:bg-gray-700">Virgule ( , )</SelectItem>
                      <SelectItem value="." className="text-white hover:bg-gray-700">Point ( . )</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white font-medium mb-2">Aperçu des formats numériques:</p>
                <p className="text-purple-200">1 000 000,50 → {formatExampleNumber(1000000.50)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Formats de date et heure */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Formats de date et heure
              </CardTitle>
              <CardDescription className="text-purple-200">
                Choisissez comment afficher les dates et heures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Format de date</Label>
                  <Select value={settings.formatDate} onValueChange={(value) => handleSettingChange('formatDate', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {formatsDate.map((format) => (
                        <SelectItem key={format.value} value={format.value} className="text-white hover:bg-gray-700">
                          {format.label} ({format.description})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Format d'heure</Label>
                  <Select value={settings.formatHeure} onValueChange={(value) => handleSettingChange('formatHeure', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="24h" className="text-white hover:bg-gray-700">24 heures (14:30)</SelectItem>
                      <SelectItem value="12h" className="text-white hover:bg-gray-700">12 heures (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-white font-medium">Premier jour de la semaine</Label>
                  <Select value={settings.premierJour} onValueChange={(value) => handleSettingChange('premierJour', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {joursDebut.map((jour) => (
                        <SelectItem key={jour.value} value={jour.value} className="text-white hover:bg-gray-700">
                          {jour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white font-medium mb-2">Aperçu des formats:</p>
                <p className="text-purple-200">
                  Date: {new Date().toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-purple-200">
                  Heure: {new Date().toLocaleTimeString('fr-FR', { 
                    hour12: settings.formatHeure === '12h',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Localisation;
