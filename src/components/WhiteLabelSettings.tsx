
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { toast } from './ui/use-toast';

interface WhiteLabelConfig {
  appName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon: string;
  footerText: string;
  hideOriginalBranding: boolean;
  customCss: string;
}

const WhiteLabelSettings: React.FC = () => {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    appName: 'FreelanceHub',
    logo: '',
    primaryColor: '#8B5CF6',
    secondaryColor: '#3B82F6',
    accentColor: '#10B981',
    favicon: '',
    footerText: 'Powered by FreelanceHub',
    hideOriginalBranding: false,
    customCss: ''
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const storedConfig = localStorage.getItem('whitelabel-config');
    if (storedConfig) {
      try {
        setConfig(JSON.parse(storedConfig));
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('whitelabel-config', JSON.stringify(config));
    
    // Appliquer les couleurs au CSS root
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--secondary', config.secondaryColor);
    root.style.setProperty('--accent', config.accentColor);
    
    // Changer le titre de la page
    document.title = config.appName;
    
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres de marque blanche ont été appliqués.",
      variant: "default"
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({ ...prev, favicon: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la configuration ?')) {
      const defaultConfig: WhiteLabelConfig = {
        appName: 'FreelanceHub',
        logo: '',
        primaryColor: '#8B5CF6',
        secondaryColor: '#3B82F6',
        accentColor: '#10B981',
        favicon: '',
        footerText: 'Powered by FreelanceHub',
        hideOriginalBranding: false,
        customCss: ''
      };
      
      setConfig(defaultConfig);
      localStorage.removeItem('whitelabel-config');
      
      toast({
        title: "Configuration réinitialisée",
        description: "Les paramètres par défaut ont été restaurés.",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Palette className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Personnalisation Marque Blanche</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            className="border-white/20 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Quitter Aperçu' : 'Aperçu'}
          </Button>
          
          <Button onClick={handleSaveConfig} className="bg-gradient-to-r from-green-500 to-emerald-500">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Générale */}
        <Card className="glass-morphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Nom de l'Application</Label>
              <Input
                value={config.appName}
                onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Mon App de Freelance"
              />
            </div>

            <div>
              <Label className="text-white">Logo Principal</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="bg-white/10 border-white/20 text-white"
                />
                {config.logo && (
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <img src={config.logo} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-white">Favicon</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="bg-white/10 border-white/20 text-white"
                />
                {config.favicon && (
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <img src={config.favicon} alt="Favicon" className="h-8 w-8 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-white">Texte de Pied de Page</Label>
              <Input
                value={config.footerText}
                onChange={(e) => setConfig(prev => ({ ...prev, footerText: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                placeholder="© 2025 Mon Entreprise"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-white">Masquer la marque originale</Label>
              <Switch
                checked={config.hideOriginalBranding}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hideOriginalBranding: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration des Couleurs */}
        <Card className="glass-morphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Palette de Couleurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Couleur Principale</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-16 h-10 bg-white/10 border-white/20"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  placeholder="#8B5CF6"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Couleur Secondaire</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-16 h-10 bg-white/10 border-white/20"
                />
                <Input
                  value={config.secondaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Couleur d'Accent</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-16 h-10 bg-white/10 border-white/20"
                />
                <Input
                  value={config.accentColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  placeholder="#10B981"
                />
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded border border-white/10">
              <Label className="text-white block mb-2">Aperçu des Couleurs</Label>
              <div className="flex space-x-2">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: config.primaryColor }}
                  title="Couleur Principale"
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: config.secondaryColor }}
                  title="Couleur Secondaire"
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: config.accentColor }}
                  title="Couleur d'Accent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSS Personnalisé */}
        <Card className="glass-morphism border-white/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">CSS Personnalisé (Avancé)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-white">CSS Personnalisé</Label>
              <Textarea
                value={config.customCss}
                onChange={(e) => setConfig(prev => ({ ...prev, customCss: e.target.value }))}
                className="bg-white/10 border-white/20 text-white font-mono text-sm"
                placeholder="/* Votre CSS personnalisé ici */
.custom-header {
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.custom-button {
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}"
                rows={8}
              />
              <p className="text-purple-200 text-xs mt-1">
                Utilisez ce champ pour ajouter des styles CSS personnalisés qui s'appliqueront à toute l'application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button 
          onClick={resetToDefault}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Réinitialiser
        </Button>
        
        <div className="text-purple-200 text-sm">
          * Les modifications seront appliquées après sauvegarde
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelSettings;
