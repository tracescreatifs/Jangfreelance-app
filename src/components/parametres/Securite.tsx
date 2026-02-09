
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Smartphone, Clock, AlertTriangle, Check, Star, Crown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useSubscription } from '../../hooks/useSubscription';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

const Securite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, payments, activateLicenseKey, cancelSubscription, loading } = useSubscription();

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    autoBackup: true,
    encryptionEnabled: true,
    accessLogging: true
  });

  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Vérifier l'ancien mot de passe en se reconnectant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Utilisateur non trouvé');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });

      if (signInError) {
        toast({
          title: "Erreur",
          description: "Le mot de passe actuel est incorrect",
          variant: "destructive"
        });
        return;
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de changer le mot de passe",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès"
      });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le mot de passe",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const enable2FA = () => {
    // Supabase ne supporte pas nativement le 2FA TOTP dans le plan gratuit.
    // On affiche un message informatif.
    toast({
      title: "2FA - Bientôt disponible",
      description: "L'authentification à deux facteurs sera disponible prochainement."
    });
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé de licence",
        variant: "destructive"
      });
      return;
    }

    setIsActivating(true);
    const result = await activateLicenseKey(licenseKey);

    if (result.success) {
      toast({
        title: "Succès",
        description: result.message
      });
      setLicenseKey('');
    } else {
      toast({
        title: "Erreur",
        description: result.message,
        variant: "destructive"
      });
    }
    setIsActivating(false);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) return;

    setIsCancelling(true);
    const result = await cancelSubscription();

    if (result.success) {
      toast({
        title: "Abonnement annulé",
        description: result.message
      });
    } else {
      toast({
        title: "Erreur",
        description: result.message,
        variant: "destructive"
      });
    }
    setIsCancelling(false);
  };

  const handleSave = () => {
    console.log('Sauvegarde paramètres sécurité:', security);
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos paramètres de sécurité ont été mis à jour"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPlanBadgeColor = (slug: string) => {
    switch (slug) {
      case 'free':
        return 'bg-gray-500';
      case 'pro':
        return 'bg-purple-500';
      case 'business':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Sécurité & Licence</h1>
        </div>

        <div className="space-y-8">
          {/* Licence & Abonnement */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Licence & Abonnement
              </CardTitle>
              <CardDescription className="text-purple-200">
                Gérez votre abonnement et activez vos clés de licence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan actuel */}
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getPlanBadgeColor(subscription?.plan?.slug || 'free')} text-white`}>
                        {subscription?.plan?.name || 'Gratuit'}
                      </Badge>
                      <Badge className={subscription?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {subscription?.status === 'active' ? 'Actif' : subscription?.status}
                      </Badge>
                    </div>
                    <p className="text-purple-200 text-sm">
                      {subscription?.billingCycle === 'yearly' ? 'Facturation annuelle' : 'Facturation mensuelle'}
                    </p>
                    {subscription?.currentPeriodEnd && (
                      <p className="text-purple-300 text-sm mt-1">
                        {subscription.cancelAtPeriodEnd ? 'Se termine le ' : 'Prochain renouvellement: '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => navigate('/tarifs')}
                      className="bg-gradient-to-r from-purple-500 to-blue-500"
                    >
                      {subscription?.plan?.slug === 'free' ? 'Passer au Pro' : 'Changer de plan'}
                    </Button>
                    {subscription?.plan?.slug !== 'free' && !subscription?.cancelAtPeriodEnd && (
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Annuler'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fonctionnalités incluses */}
              {subscription?.plan?.features && (
                <div>
                  <p className="text-white font-medium mb-3">Fonctionnalités incluses:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subscription.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-purple-200">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clé de licence si présente */}
              {subscription?.licenseKey && (
                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                  <p className="text-green-400 text-sm">
                    Licence activée: <span className="font-mono">{subscription.licenseKey}</span>
                  </p>
                </div>
              )}

              {/* Activer une clé de licence */}
              <div className="pt-4 border-t border-white/10">
                <Label className="text-white font-medium mb-2 block">Activer une clé de licence</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200 font-mono"
                  />
                  <Button
                    onClick={handleActivateLicense}
                    disabled={isActivating || !licenseKey.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activer'}
                  </Button>
                </div>
                <p className="text-purple-300 text-sm mt-2">
                  Vous avez reçu une clé de licence ? Entrez-la ici pour activer votre abonnement.
                </p>
              </div>

              {/* Historique des paiements */}
              {payments.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white font-medium mb-3">Historique des paiements</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {payments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
                      >
                        <div>
                          <p className="text-white text-sm">{payment.description || 'Paiement'}</p>
                          <p className="text-purple-300 text-xs">{formatDate(payment.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge className={payment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} >
                            {payment.status === 'completed' ? 'Payé' : payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mot de passe */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Mot de passe
              </CardTitle>
              <CardDescription className="text-purple-200">
                Changez votre mot de passe de connexion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white font-medium">Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => handlePasswordChange('current', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-medium">Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => handlePasswordChange('new', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-200"
                  />
                </div>
              </div>

              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  Utilisez au moins 8 caractères avec des lettres, chiffres et symboles.
                </AlertDescription>
              </Alert>

              <Button
                onClick={changePassword}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
                disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Changer le mot de passe'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Authentification à deux facteurs */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Authentification à deux facteurs (2FA)
              </CardTitle>
              <CardDescription className="text-purple-200">
                Ajoutez une couche de sécurité supplémentaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    Statut: {security.twoFactorEnabled ?
                      <span className="text-green-400">✅ Activée</span> :
                      <span className="text-orange-400">⚠️ Désactivée</span>
                    }
                  </p>
                  <p className="text-purple-200 text-sm">
                    {security.twoFactorEnabled ?
                      'Votre compte est protégé par 2FA' :
                      'Recommandé pour sécuriser votre compte'
                    }
                  </p>
                </div>
                {!security.twoFactorEnabled && (
                  <Button
                    onClick={enable2FA}
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    Activer 2FA
                  </Button>
                )}
              </div>

              {security.twoFactorEnabled && (
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <p className="text-green-200 mb-2">Applications configurées:</p>
                  <p className="text-white">• Google Authenticator</p>
                  <p className="text-white">• SMS: +221 77 *** **67</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paramètres de sécurité */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Paramètres avancés
              </CardTitle>
              <CardDescription className="text-purple-200">
                Configurez les options de sécurité avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Sauvegarde automatique</Label>
                    <p className="text-purple-200 text-sm">Sauvegarder vos données quotidiennement</p>
                  </div>
                  <Switch
                    checked={security.autoBackup}
                    onCheckedChange={(checked) => handleSecurityChange('autoBackup', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Chiffrement des données</Label>
                    <p className="text-purple-200 text-sm">Chiffrer les données sensibles</p>
                  </div>
                  <Switch
                    checked={security.encryptionEnabled}
                    onCheckedChange={(checked) => handleSecurityChange('encryptionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Journal d'accès</Label>
                    <p className="text-purple-200 text-sm">Enregistrer les connexions</p>
                  </div>
                  <Switch
                    checked={security.accessLogging}
                    onCheckedChange={(checked) => handleSecurityChange('accessLogging', checked)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-medium">Délai d'expiration de session (minutes)</Label>
                <Input
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-purple-200 w-32"
                />
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

export default Securite;
