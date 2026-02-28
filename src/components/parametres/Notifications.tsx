
import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Calendar, DollarSign, Users, Clock, AlertTriangle, Smartphone, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { pushNotificationService } from '../../services/pushNotificationService';

const Notifications = () => {
  const { preferences: savedPrefs, loading, updatePreferences } = useUserPreferences();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushLoading, setPushLoading] = useState(false);

  const defaultPreferences = {
    appNotifications: true,
    newProject: true,
    projectDeadline: true,
    invoiceOverdue: true,
    paymentReceived: true,
    clientMessages: true,
    systemUpdates: false,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
    weekendNotifications: false,
  };

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [savedState, setSavedState] = useState(defaultPreferences);

  // Charger l'état des push notifications
  useEffect(() => {
    const checkPushState = async () => {
      const supported = pushNotificationService.isSupported();
      setPushSupported(supported);
      if (supported) {
        setPushPermission(pushNotificationService.getPermissionState());
        const subscribed = await pushNotificationService.isSubscribed();
        setPushSubscribed(subscribed);
      }
    };
    checkPushState();
  }, []);

  useEffect(() => {
    if (savedPrefs) {
      const loaded = {
        ...defaultPreferences,
        appNotifications: savedPrefs.notificationsPush,
        invoiceOverdue: savedPrefs.notificationsRappels,
        paymentReceived: savedPrefs.notificationsPayment,
        newProject: savedPrefs.notificationsNewClient,
      };
      setPreferences(loaded);
      setSavedState(loaded);
      setHasChanges(false);
    }
  }, [savedPrefs]);

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleCancel = () => {
    setPreferences(savedState);
    setHasChanges(false);
  };

  // ── Push subscription toggle ────────────────────────────

  const handlePushToggle = async () => {
    if (!user) return;
    setPushLoading(true);
    try {
      if (pushSubscribed) {
        // Se désabonner
        const success = await pushNotificationService.unsubscribe(user.id);
        if (success) {
          setPushSubscribed(false);
          toast({ title: 'Notifications push désactivées', description: 'Vous ne recevrez plus de notifications push.' });
        }
      } else {
        // S'abonner
        const success = await pushNotificationService.subscribe(user.id);
        if (success) {
          setPushSubscribed(true);
          setPushPermission('granted');
          toast({ title: 'Notifications push activées !', description: 'Vous recevrez des notifications même quand l\'app est fermée.' });
        } else {
          const perm = pushNotificationService.getPermissionState();
          setPushPermission(perm);
          if (perm === 'denied') {
            toast({
              title: 'Permission refusée',
              description: 'Autorisez les notifications dans les paramètres de votre navigateur.',
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier l\'abonnement push.', variant: 'destructive' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    const success = await pushNotificationService.sendTestNotification();
    if (success) {
      toast({ title: 'Notification envoyée', description: 'Vérifiez vos notifications système.' });
    } else {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer la notification de test.', variant: 'destructive' });
    }
  };

  const notificationTypes = [
    {
      key: 'newProject',
      title: 'Nouveaux projets',
      description: 'Notification lors de la création d\'un projet',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      key: 'projectDeadline',
      title: 'Échéances de projets',
      description: 'Rappels avant les dates limites',
      icon: Calendar,
      color: 'text-orange-400'
    },
    {
      key: 'invoiceOverdue',
      title: 'Factures en retard',
      description: 'Alertes pour les factures impayées',
      icon: AlertTriangle,
      color: 'text-red-400'
    },
    {
      key: 'paymentReceived',
      title: 'Paiements reçus',
      description: 'Confirmation des règlements',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      key: 'clientMessages',
      title: 'Messages clients',
      description: 'Nouveaux messages et commentaires',
      icon: MessageSquare,
      color: 'text-purple-400'
    },
    {
      key: 'systemUpdates',
      title: 'Mises à jour système',
      description: 'Nouvelles fonctionnalités et correctifs',
      icon: Bell,
      color: 'text-indigo-400'
    }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        notificationsPush: preferences.appNotifications,
        notificationsRappels: preferences.invoiceOverdue,
        notificationsPayment: preferences.paymentReceived,
        notificationsNewClient: preferences.newProject,
      });
      setSavedState(preferences);
      setHasChanges(false);
      toast({
        title: "Notifications sauvegardées",
        description: "Vos préférences ont été mises à jour"
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
        <div className="flex items-center space-x-3 mb-6 sm:mb-8">
          <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
          <h1 className="text-xl sm:text-3xl font-bold text-white">Notifications</h1>
        </div>

        <div className="space-y-8">

          {/* ── Notifications Push (PWA) ─────────────────────── */}
          <Card className="glass-morphism border-white/20 relative overflow-hidden">
            {/* Accent gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-400" />
                Notifications Push
              </CardTitle>
              <CardDescription className="text-purple-200">
                Recevez des notifications même quand l'application est fermée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!pushSupported ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Non supporté</p>
                    <p className="text-white/50 text-xs">Votre navigateur ne supporte pas les notifications push. Essayez Chrome, Edge ou Firefox.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* État actuel */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {pushSubscribed ? (
                        <Wifi className="w-5 h-5 text-green-400" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-white/30" />
                      )}
                      <div>
                        <Label className="text-white font-medium">Notifications push</Label>
                        <p className="text-purple-200 text-sm">
                          {pushSubscribed
                            ? 'Activées — vous recevrez des alertes sur cet appareil'
                            : pushPermission === 'denied'
                            ? 'Bloquées — autorisez dans les paramètres du navigateur'
                            : 'Désactivées — activez pour recevoir des alertes'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pushSubscribed}
                      onCheckedChange={handlePushToggle}
                      disabled={pushLoading || pushPermission === 'denied'}
                    />
                  </div>

                  {/* Statut détaillé */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border ${
                      pushPermission === 'granted'
                        ? 'bg-green-500/10 border-green-500/20'
                        : pushPermission === 'denied'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    }`}>
                      <p className="text-white/40 text-xs mb-1">Permission</p>
                      <p className={`text-sm font-medium ${
                        pushPermission === 'granted' ? 'text-green-300' :
                        pushPermission === 'denied' ? 'text-red-300' : 'text-yellow-300'
                      }`}>
                        {pushPermission === 'granted' ? 'Autorisée' :
                         pushPermission === 'denied' ? 'Refusée' : 'Non demandée'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      pushSubscribed
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <p className="text-white/40 text-xs mb-1">Abonnement</p>
                      <p className={`text-sm font-medium ${pushSubscribed ? 'text-green-300' : 'text-white/40'}`}>
                        {pushSubscribed ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                  </div>

                  {/* Bouton de test */}
                  {pushSubscribed && (
                    <Button
                      onClick={handleTestPush}
                      variant="outline"
                      size="sm"
                      className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Envoyer une notification test
                    </Button>
                  )}

                  {pushPermission === 'denied' && (
                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white/60 text-xs">
                        Les notifications sont bloquées. Pour les réactiver, cliquez sur l'icône du cadenas dans la barre d'adresse de votre navigateur, puis autorisez les notifications.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Notifications in-app ──────────────────────────── */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Notifications dans l'application</CardTitle>
              <CardDescription className="text-purple-200">
                Recevez vos notifications directement dans Jang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <div>
                    <Label className="text-white font-medium">Alertes dans l'application</Label>
                    <p className="text-purple-200 text-sm">Toasts et badges de notification</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.appNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('appNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Types de notifications */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Types de notifications</CardTitle>
              <CardDescription className="text-purple-200">
                Configurez les événements qui déclenchent des notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <type.icon className={`w-6 h-6 ${type.color}`} />
                      <div>
                        <Label className="text-white font-medium">{type.title}</Label>
                        <p className="text-purple-200 text-sm">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[type.key as keyof typeof preferences] as boolean}
                      onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Heures silencieuses */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Heures silencieuses
              </CardTitle>
              <CardDescription className="text-purple-200">
                Définissez des créneaux sans notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Activer les heures silencieuses</Label>
                  <p className="text-purple-200 text-sm">Pas de notifications pendant ces heures</p>
                </div>
                <Switch
                  checked={preferences.quietHours}
                  onCheckedChange={(checked) => handlePreferenceChange('quietHours', checked)}
                />
              </div>

              {preferences.quietHours && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-medium">Début</Label>
                    <input
                      type="time"
                      value={preferences.quietStart}
                      onChange={(e) => handlePreferenceChange('quietStart', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Fin</Label>
                    <input
                      type="time"
                      value={preferences.quietEnd}
                      onChange={(e) => handlePreferenceChange('quietEnd', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Notifications le weekend</Label>
                  <p className="text-purple-200 text-sm">Recevoir des notifications samedi et dimanche</p>
                </div>
                <Switch
                  checked={preferences.weekendNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('weekendNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-8">
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
  );
};

export default Notifications;
