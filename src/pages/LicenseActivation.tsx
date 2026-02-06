import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Key, CheckCircle2, XCircle, Calendar, Users, FolderOpen, Shield } from 'lucide-react';
import { LicenseGenerator, LicenseInfo } from '../utils/licenseGenerator';
import { toast } from '../components/ui/use-toast';

const LicenseActivation = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const [currentLicense, setCurrentLicense] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Charger la licence existante depuis le localStorage
    const storedLicense = localStorage.getItem('freelance-license');
    if (storedLicense) {
      try {
        const license = JSON.parse(storedLicense);
        // Revalider la licence
        const validatedLicense = LicenseGenerator.validateLicenseKey(license.key);
        if (validatedLicense && validatedLicense.isValid) {
          setCurrentLicense(validatedLicense);
        } else {
          // Licence expirée ou invalide
          localStorage.removeItem('freelance-license');
          setCurrentLicense(null);
        }
      } catch (error) {
        localStorage.removeItem('freelance-license');
      }
    }
  }, []);

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setError('Veuillez saisir une clé de licence');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Valider la clé de licence
      const license = LicenseGenerator.validateLicenseKey(licenseKey.trim());
      
      if (!license) {
        setError('Clé de licence invalide');
        return;
      }

      if (!license.isValid) {
        setError('Cette licence a expiré');
        return;
      }

      // Sauvegarder la licence
      localStorage.setItem('freelance-license', JSON.stringify(license));
      setCurrentLicense(license);
      setLicenseKey('');
      
      toast({
        title: "Licence activée",
        description: `Votre licence ${license.plan} a été activée avec succès!`,
        variant: "default"
      });
    } catch (error) {
      setError('Erreur lors de l\'activation de la licence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateLicense = () => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver votre licence ?')) {
      localStorage.removeItem('freelance-license');
      setCurrentLicense(null);
      toast({
        title: "Licence désactivée",
        description: "Votre licence a été désactivée.",
        variant: "default"
      });
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-500';
      case 'PRO': return 'bg-purple-500';
      case 'ENTERPRISE': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Gestion des Licences</h1>
          <p className="text-purple-200">Activez et gérez votre licence FreeLance Manager</p>
        </div>

        {!currentLicense ? (
          // Formulaire d'activation
          <Card className="glass-morphism border-white/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">Activer votre licence</CardTitle>
              <CardDescription className="text-purple-200">
                Saisissez votre clé de licence pour accéder à toutes les fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="license-key" className="text-white">Clé de licence</Label>
                <Input
                  id="license-key"
                  type="text"
                  placeholder="FL-PRO-XXXXXXXX-XXXXXXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleActivateLicense()}
                />
              </div>

              {error && (
                <Alert className="border-red-500/20 bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleActivateLicense}
                disabled={isLoading || !licenseKey.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform"
              >
                {isLoading ? 'Activation en cours...' : 'Activer la licence'}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {Object.entries(LicenseGenerator.getAllPlans()).map(([planName, planInfo]) => (
                  <Card key={planName} className="bg-white/5 border-white/10">
                    <CardHeader className="text-center pb-4">
                      <Badge className={`${getPlanColor(planName)} text-white mx-auto`}>
                        {planName}
                      </Badge>
                      <div className="text-white text-2xl font-bold">
                        {new Intl.NumberFormat('fr-FR').format(planInfo.price)} XOF
                      </div>
                      <div className="text-purple-300 text-sm">par mois</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm text-purple-200">
                          <FolderOpen className="w-4 h-4 mr-2 text-purple-400" />
                          {planInfo.maxProjects === -1 ? 'Projets illimités' : `${planInfo.maxProjects} projets`}
                        </li>
                        <li className="flex items-center text-sm text-purple-200">
                          <Users className="w-4 h-4 mr-2 text-purple-400" />
                          {planInfo.maxUsers} utilisateur{planInfo.maxUsers > 1 ? 's' : ''}
                        </li>
                        {planInfo.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-purple-200">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Affichage de la licence active
          <div className="space-y-6">
            {isExpiringSoon(currentLicense.expiryDate) && (
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Votre licence expire bientôt le {formatDate(currentLicense.expiryDate)}. 
                  Renouvelez-la pour continuer à utiliser l'application.
                </AlertDescription>
              </Alert>
            )}

            <Card className="glass-morphism border-white/20">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl">Licence Active</CardTitle>
                <Badge className={`${getPlanColor(currentLicense.plan)} text-white mx-auto mt-2`}>
                  {currentLicense.plan}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-purple-300">Clé de licence</Label>
                      <div className="font-mono text-white bg-white/10 p-3 rounded border">
                        {currentLicense.key}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-purple-300">Date d'expiration</Label>
                      <div className="text-white font-semibold">
                        {formatDate(currentLicense.expiryDate)}
                      </div>
                    </div>

                    {currentLicense.clientName && (
                      <div>
                        <Label className="text-purple-300">Client</Label>
                        <div className="text-white">{currentLicense.clientName}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-purple-300">Limites</Label>
                      <div className="space-y-2">
                        <div className="flex items-center text-white">
                          <FolderOpen className="w-4 h-4 mr-2 text-purple-400" />
                          {currentLicense.maxProjects === -1 ? 'Projets illimités' : `${currentLicense.maxProjects} projets max`}
                        </div>
                        <div className="flex items-center text-white">
                          <Users className="w-4 h-4 mr-2 text-purple-400" />
                          {currentLicense.maxUsers} utilisateur{currentLicense.maxUsers > 1 ? 's' : ''} max
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-purple-300">Fonctionnalités incluses</Label>
                      <ul className="space-y-1 mt-2">
                        {currentLicense.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleDeactivateLicense}
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    Désactiver la licence
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseActivation;