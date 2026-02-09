
import React, { useState, useEffect } from 'react';
import { Settings, Layout, Table, BarChart3, FileText, Clock, DollarSign, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useToast } from '../../hooks/use-toast';

const STORAGE_KEY = 'businessPreferences';

const defaultPreferences = {
  defaultView: 'grid',
  autoSave: true,
  showAdvancedFeatures: false,
  defaultCurrency: 'CFA',
  defaultTaxRate: '18',
  defaultPaymentTerms: '30',
  defaultProjectDuration: '30',
  compactTables: false,
  showProgressBars: true,
  autoRefresh: true,
  invoicePrefix: 'FAC',
  quotePrefix: 'DEV',
  autoInvoiceNumbers: true,
  defaultProjectStatus: 'nouveau',
  showClientInProjectList: true,
  autoArchiveCompleted: false,
  defaultHourlyRate: '15000',
  roundTimeToQuarter: true,
  autoStartTimer: false,
};

const PreferencesMetier = () => {
  const { preferences: savedPrefs, loading, updatePreferences } = useUserPreferences();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [savedState, setSavedState] = useState(preferences);

  // Synchroniser les champs Supabase quand ils arrivent
  useEffect(() => {
    if (savedPrefs) {
      const stored = localStorage.getItem(STORAGE_KEY);
      let localPrefs = {};
      if (stored) {
        try { localPrefs = JSON.parse(stored); } catch { /* ignore */ }
      }

      const merged = {
        ...defaultPreferences,
        ...localPrefs,
        defaultHourlyRate: String(savedPrefs.tauxHoraireDefaut || 15000),
        defaultPaymentTerms: String(savedPrefs.delaiPaiementDefaut || 30),
      };
      setPreferences(merged);
      setSavedState(merged);
      setHasChanges(false);
    }
  }, [savedPrefs]);

  const viewOptions = [
    { value: 'grid', label: 'Grille', icon: Layout },
    { value: 'list', label: 'Liste', icon: Table },
    { value: 'cards', label: 'Cartes', icon: FileText },
  ];

  const currencies = [
    { value: 'CFA', label: 'Franc CFA' },
    { value: 'EUR', label: 'Euro' },
    { value: 'USD', label: 'Dollar US' },
  ];

  const taxRates = [
    { value: '0', label: 'Exonéré (0%)' },
    { value: '5', label: 'BRS (5%)' },
    { value: '18', label: 'TVA (18%)' },
  ];

  const projectStatuses = [
    { value: 'nouveau', label: 'Nouveau' },
    { value: 'en-cours', label: 'En cours' },
    { value: 'en-attente', label: 'En attente' },
    { value: 'terminé', label: 'Terminé' },
  ];

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    setPreferences(savedState);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder les champs Supabase
      await updatePreferences({
        tauxHoraireDefaut: parseInt(preferences.defaultHourlyRate) || 15000,
        delaiPaiementDefaut: parseInt(preferences.defaultPaymentTerms) || 30,
      });

      // Sauvegarder tout en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSavedState(preferences);
      setHasChanges(false);

      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences métier ont été mises à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast({
      title: "Préférences réinitialisées",
      description: "Cliquez sur Sauvegarder pour confirmer."
    });
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
          <Settings className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Préférences Métier</h1>
        </div>

        <div className="space-y-8">
          {/* Interface et affichage */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                Interface et affichage
              </CardTitle>
              <CardDescription className="text-purple-200">
                Personnalisez l'affichage par défaut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white font-medium mb-3 block">Vue par défaut</Label>
                <div className="grid grid-cols-3 gap-4">
                  {viewOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange('defaultView', option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        preferences.defaultView === option.value
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <option.icon className="w-6 h-6 text-white mx-auto mb-2" />
                      <p className="text-white font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Sauvegarde automatique</Label>
                    <p className="text-purple-200 text-sm">Sauvegarder en temps réel</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Fonctions avancées</Label>
                    <p className="text-purple-200 text-sm">Afficher les options expertes</p>
                  </div>
                  <Switch
                    checked={preferences.showAdvancedFeatures}
                    onCheckedChange={(checked) => handlePreferenceChange('showAdvancedFeatures', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Tableaux compacts</Label>
                    <p className="text-purple-200 text-sm">Réduire l'espacement</p>
                  </div>
                  <Switch
                    checked={preferences.compactTables}
                    onCheckedChange={(checked) => handlePreferenceChange('compactTables', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Barres de progression</Label>
                    <p className="text-purple-200 text-sm">Indicateurs visuels</p>
                  </div>
                  <Switch
                    checked={preferences.showProgressBars}
                    onCheckedChange={(checked) => handlePreferenceChange('showProgressBars', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valeurs par défaut */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Valeurs par défaut
              </CardTitle>
              <CardDescription className="text-purple-200">
                Configurez les valeurs pré-remplies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Devise par défaut</Label>
                  <Select value={preferences.defaultCurrency} onValueChange={(value) => handlePreferenceChange('defaultCurrency', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value} className="text-white hover:bg-gray-700">
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Taux de taxe par défaut</Label>
                  <Select value={preferences.defaultTaxRate} onValueChange={(value) => handlePreferenceChange('defaultTaxRate', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {taxRates.map((rate) => (
                        <SelectItem key={rate.value} value={rate.value} className="text-white hover:bg-gray-700">
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Délai de paiement (jours)</Label>
                  <Input
                    type="number"
                    value={preferences.defaultPaymentTerms}
                    onChange={(e) => handlePreferenceChange('defaultPaymentTerms', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Durée projet par défaut (jours)</Label>
                  <Input
                    type="number"
                    value={preferences.defaultProjectDuration}
                    onChange={(e) => handlePreferenceChange('defaultProjectDuration', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturation */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Facturation
              </CardTitle>
              <CardDescription className="text-purple-200">
                Préférences pour les factures et devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-white font-medium">Préfixe factures</Label>
                  <Input
                    value={preferences.invoicePrefix}
                    onChange={(e) => handlePreferenceChange('invoicePrefix', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                    placeholder="FAC"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Préfixe devis</Label>
                  <Input
                    value={preferences.quotePrefix}
                    onChange={(e) => handlePreferenceChange('quotePrefix', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                    placeholder="DEV"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Numérotation auto</Label>
                    <p className="text-purple-200 text-sm">Incrémenter automatiquement</p>
                  </div>
                  <Switch
                    checked={preferences.autoInvoiceNumbers}
                    onCheckedChange={(checked) => handlePreferenceChange('autoInvoiceNumbers', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projets */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestion des projets
              </CardTitle>
              <CardDescription className="text-purple-200">
                Préférences pour la gestion de projets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Statut par défaut</Label>
                  <Select value={preferences.defaultProjectStatus} onValueChange={(value) => handlePreferenceChange('defaultProjectStatus', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {projectStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="text-white hover:bg-gray-700">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Afficher client</Label>
                    <p className="text-purple-200 text-sm">Dans la liste des projets</p>
                  </div>
                  <Switch
                    checked={preferences.showClientInProjectList}
                    onCheckedChange={(checked) => handlePreferenceChange('showClientInProjectList', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Archivage auto</Label>
                    <p className="text-purple-200 text-sm">Archives projets terminés</p>
                  </div>
                  <Switch
                    checked={preferences.autoArchiveCompleted}
                    onCheckedChange={(checked) => handlePreferenceChange('autoArchiveCompleted', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suivi du temps */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Suivi du temps
              </CardTitle>
              <CardDescription className="text-purple-200">
                Préférences pour le suivi du temps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Taux horaire par défaut (CFA)</Label>
                  <Input
                    type="number"
                    value={preferences.defaultHourlyRate}
                    onChange={(e) => handlePreferenceChange('defaultHourlyRate', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Arrondir au quart d'heure</Label>
                    <p className="text-purple-200 text-sm">0:07 → 0:15</p>
                  </div>
                  <Switch
                    checked={preferences.roundTimeToQuarter}
                    onCheckedChange={(checked) => handlePreferenceChange('roundTimeToQuarter', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Démarrer timer auto</Label>
                    <p className="text-purple-200 text-sm">Au changement de projet</p>
                  </div>
                  <Switch
                    checked={preferences.autoStartTimer}
                    onCheckedChange={(checked) => handlePreferenceChange('autoStartTimer', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Réinitialiser
          </Button>
          <div className="space-x-4">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleCancel}
              disabled={!hasChanges}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesMetier;
