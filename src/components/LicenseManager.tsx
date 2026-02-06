
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Shield, Key, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { toast } from './ui/use-toast';

interface LicenseInfo {
  key: string;
  isValid: boolean;
  plan: 'Basique' | 'Pro' | 'Enterprise';
  expiryDate: string;
  features: string[];
  maxProjects: number;
  maxUsers: number;
}

const LicenseManager: React.FC = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const [currentLicense, setCurrentLicense] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedLicense = localStorage.getItem('freelance-license');
    if (storedLicense) {
      try {
        setCurrentLicense(JSON.parse(storedLicense));
      } catch (error) {
        console.error('Erreur lors du chargement de la licence:', error);
      }
    }
  }, []);

  const validateLicense = async (key: string): Promise<LicenseInfo | null> => {
    // Simulation de validation de licence
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Exemple de validation basique
    if (key.startsWith('FB-BASIC-')) {
      return {
        key,
        isValid: true,
        plan: 'Basique',
        expiryDate: '2025-12-31',
        features: ['Gestion des projets', 'Gestion des clients', 'Facturation basique'],
        maxProjects: 10,
        maxUsers: 1
      };
    } else if (key.startsWith('FB-PRO-')) {
      return {
        key,
        isValid: true,
        plan: 'Pro',
        expiryDate: '2025-12-31',
        features: ['Toutes les fonctionnalités Basique', 'Rapports avancés', 'Exports PDF', 'Support prioritaire'],
        maxProjects: 50,
        maxUsers: 3
      };
    } else if (key.startsWith('FB-ENT-')) {
      return {
        key,
        isValid: true,
        plan: 'Enterprise',
        expiryDate: '2025-12-31',
        features: ['Toutes les fonctionnalités Pro', 'Multi-utilisateurs illimités', 'API personnalisée', 'Support dédié'],
        maxProjects: -1,
        maxUsers: -1
      };
    }
    
    return null;
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une clé de licence valide.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const licenseInfo = await validateLicense(licenseKey);
      
      if (licenseInfo) {
        setCurrentLicense(licenseInfo);
        localStorage.setItem('freelance-license', JSON.stringify(licenseInfo));
        setLicenseKey('');
        
        toast({
          title: "Licence activée !",
          description: `Votre licence ${licenseInfo.plan} a été activée avec succès.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Licence invalide",
          description: "La clé de licence saisie n'est pas valide.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider la licence. Vérifiez votre connexion.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateLicense = () => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver votre licence ?')) {
      setCurrentLicense(null);
      localStorage.removeItem('freelance-license');
      
      toast({
        title: "Licence désactivée",
        description: "Votre licence a été désactivée.",
        variant: "default"
      });
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Basique': return 'bg-blue-500';
      case 'Pro': return 'bg-purple-500';
      case 'Enterprise': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Gestion des Licences</h2>
      </div>

      {!currentLicense ? (
        <Card className="glass-morphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Activer une Licence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Clé de Licence</Label>
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Saisissez votre clé de licence (ex: FB-PRO-XXXXX-XXXXX)"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
            
            <Button 
              onClick={handleActivateLicense}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {isLoading ? 'Validation en cours...' : 'Activer la Licence'}
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <h4 className="text-blue-300 font-medium mb-2">Formats de clés supportés :</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• <code className="bg-blue-500/20 px-1 rounded">FB-BASIC-XXXXX-XXXXX</code> - Plan Basique</li>
                <li>• <code className="bg-purple-500/20 px-1 rounded">FB-PRO-XXXXX-XXXXX</code> - Plan Pro</li>
                <li>• <code className="bg-yellow-500/20 px-1 rounded">FB-ENT-XXXXX-XXXXX</code> - Plan Enterprise</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-morphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Licence Active</span>
              </div>
              <Badge className={`${getPlanColor(currentLicense.plan)} text-white`}>
                {currentLicense.plan}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-200">Clé de Licence</Label>
                <div className="bg-white/5 p-2 rounded border border-white/10">
                  <code className="text-white text-sm">{currentLicense.key}</code>
                </div>
              </div>
              
              <div>
                <Label className="text-purple-200">Date d'expiration</Label>
                <div className="flex items-center space-x-2 bg-white/5 p-2 rounded border border-white/10">
                  <Calendar className="w-4 h-4 text-purple-300" />
                  <span className="text-white text-sm">{formatDate(currentLicense.expiryDate)}</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-purple-200">Limites</Label>
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-300">Projets max :</span>
                    <span className="text-white ml-2">
                      {currentLicense.maxProjects === -1 ? 'Illimité' : currentLicense.maxProjects}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-300">Utilisateurs max :</span>
                    <span className="text-white ml-2">
                      {currentLicense.maxUsers === -1 ? 'Illimité' : currentLicense.maxUsers}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-purple-200">Fonctionnalités incluses</Label>
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <ul className="space-y-1">
                  {currentLicense.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleDeactivateLicense}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Désactiver la Licence
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass-morphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span>Informations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-purple-200 text-sm space-y-2">
            <p>• Votre licence est vérifiée périodiquement pour garantir sa validité.</p>
            <p>• En cas de problème de connexion, l'application continuera de fonctionner pendant 7 jours.</p>
            <p>• Contactez le support si vous rencontrez des difficultés avec votre licence.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseManager;
