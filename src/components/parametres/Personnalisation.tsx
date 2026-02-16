
import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Monitor, Eye, Layout } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '../../hooks/useUserPreferences';

const Personnalisation = () => {
  const { toast } = useToast();
  const { preferences: savedPrefs, loading, updatePreferences } = useUserPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const defaultPrefs = {
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false,
    animationsEnabled: true,
    showProgressBars: true,
    sidebarCollapsed: false,
    tableStyle: 'modern',
  };

  const [preferences, setPreferences] = useState(() => {
    // Charger depuis localStorage au premier rendu
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        return { ...defaultPrefs, ...JSON.parse(stored) };
      } catch {
        return defaultPrefs;
      }
    }
    return defaultPrefs;
  });

  const [savedState, setSavedState] = useState(preferences);

  // Charger les préférences depuis Supabase
  useEffect(() => {
    if (savedPrefs) {
      const stored = localStorage.getItem('userPreferences');
      let localPrefs = {};
      if (stored) {
        try { localPrefs = JSON.parse(stored); } catch { /* ignore */ }
      }

      const newPrefs = {
        ...defaultPrefs,
        ...localPrefs,
        theme: savedPrefs.theme || 'dark',
      };
      setPreferences(newPrefs);
      setSavedState(newPrefs);
      setHasChanges(false);
      applyPreferences(newPrefs);
    }
  }, [savedPrefs]);

  const themes = [
    { value: 'dark', label: 'Sombre', icon: Moon, description: 'Thème sombre (recommandé)' },
    { value: 'light', label: 'Clair', icon: Sun, description: 'Thème clair' },
    { value: 'auto', label: 'Automatique', icon: Monitor, description: 'Suit les préférences système' },
  ];

  const fontSizes = [
    { value: 'small', label: 'Petit' },
    { value: 'medium', label: 'Moyen' },
    { value: 'large', label: 'Grand' },
  ];

  const tableStyles = [
    { value: 'modern', label: 'Moderne' },
    { value: 'classic', label: 'Classique' },
    { value: 'minimal', label: 'Minimaliste' },
  ];

  const applyPreferences = (prefs = preferences) => {
    const html = document.documentElement;
    const body = document.body;

    // Appliquer le thème
    if (prefs.theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else if (prefs.theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      // Auto mode - suit les préférences système
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
    }

    // Appliquer la taille de police
    body.classList.remove('text-sm', 'text-base', 'text-lg');
    if (prefs.fontSize === 'small') {
      body.classList.add('text-sm');
    } else if (prefs.fontSize === 'large') {
      body.classList.add('text-lg');
    } else {
      body.classList.add('text-base');
    }

    // Appliquer le mode compact
    if (prefs.compactMode) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }

    // Appliquer les animations
    if (!prefs.animationsEnabled) {
      body.classList.add('no-animations');
    } else {
      body.classList.remove('no-animations');
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    applyPreferences(newPrefs);
    setHasChanges(true);
  };

  const handleCancel = () => {
    setPreferences(savedState);
    applyPreferences(savedState);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder dans Supabase
      await updatePreferences({
        theme: preferences.theme,
      });

      // Aussi en localStorage pour persistance rapide
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      applyPreferences(preferences);
      setSavedState(preferences);
      setHasChanges(false);

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été appliquées avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPrefs);
    applyPreferences(defaultPrefs);
    setHasChanges(true);

    toast({
      title: "Paramètres réinitialisés",
      description: "Cliquez sur Sauvegarder pour confirmer la réinitialisation.",
    });
  };

  const previewTheme = () => {
    const currentTheme = preferences.theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const previewPrefs = { ...preferences, theme: nextTheme };
    applyPreferences(previewPrefs);
    
    setTimeout(() => {
      applyPreferences(preferences);
    }, 3000);
  };

  return (
    <div className="w-full">
      <div className="glass-morphism p-6 lg:p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Palette className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Personnalisation</h1>
        </div>

        <div className="space-y-8">
          {/* Thème */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Eye className="w-5 h-5 mr-2" />
                Apparence
              </CardTitle>
              <CardDescription className="text-purple-200">
                Personnalisez l'apparence de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white font-medium mb-3 block">Thème</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => handlePreferenceChange('theme', theme.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        preferences.theme === theme.value
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <theme.icon className="w-6 h-6 text-white mx-auto mb-2" />
                      <p className="text-white font-medium">{theme.label}</p>
                      <p className="text-purple-200 text-sm">{theme.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white font-medium mb-3 block">Taille de police</Label>
                <Select value={preferences.fontSize} onValueChange={(value) => handlePreferenceChange('fontSize', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {fontSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-white hover:bg-gray-700">
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interface */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-base sm:text-lg">
                <Layout className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Interface
              </CardTitle>
              <CardDescription className="text-purple-200">
                Configurez le comportement de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Mode compact</Label>
                    <p className="text-purple-200 text-sm">Réduire l'espacement des éléments</p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Animations</Label>
                    <p className="text-purple-200 text-sm">Activer les transitions animées</p>
                  </div>
                  <Switch
                    checked={preferences.animationsEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('animationsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Barres de progression</Label>
                    <p className="text-purple-200 text-sm">Afficher les indicateurs visuels</p>
                  </div>
                  <Switch
                    checked={preferences.showProgressBars}
                    onCheckedChange={(checked) => handlePreferenceChange('showProgressBars', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Sidebar réduite</Label>
                    <p className="text-purple-200 text-sm">Démarrer avec la sidebar réduite</p>
                  </div>
                  <Switch
                    checked={preferences.sidebarCollapsed}
                    onCheckedChange={(checked) => handlePreferenceChange('sidebarCollapsed', checked)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-medium">Style des tableaux</Label>
                <Select value={preferences.tableStyle} onValueChange={(value) => handlePreferenceChange('tableStyle', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {tableStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value} className="text-white hover:bg-gray-700">
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-base sm:text-lg">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Aperçu
              </CardTitle>
              <CardDescription className="text-purple-200">
                Prévisualisation de vos paramètres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white/5 p-4 sm:p-6 rounded-lg border border-white/10">
                <div className="space-y-4">
                  <span className="text-white">Exemple de texte</span>
                  {preferences.showProgressBars && (
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full w-3/4 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                    </div>
                  )}
                  <div className={`text-purple-200 ${preferences.fontSize === 'small' ? 'text-sm' : preferences.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    Exemple de texte avec la taille sélectionnée
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 space-y-4 sm:space-y-0">
          <Button 
            onClick={resetToDefaults}
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            Réinitialiser
          </Button>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Button
              onClick={previewTheme}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
            >
              Aperçu (3s)
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
              onClick={handleCancel}
              disabled={!hasChanges}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform w-full sm:w-auto"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personnalisation;
