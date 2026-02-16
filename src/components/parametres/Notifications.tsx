
import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Calendar, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useToast } from '../../hooks/use-toast';

const Notifications = () => {
  const { preferences: savedPrefs, loading, updatePreferences } = useUserPreferences();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  const testNotification = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Non supporté",
        description: "Les notifications ne sont pas supportées par votre navigateur",
        variant: "destructive"
      });
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      new Notification('Jang - Freelance', {
        body: 'Ceci est une notification de test !',
        icon: '/favicon.ico'
      });
      toast({
        title: "Notification envoyée",
        description: "Vérifiez vos notifications système"
      });
    } else {
      toast({
        title: "Permission refusée",
        description: "Autorisez les notifications dans les paramètres de votre navigateur",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-morphism p-8 rounded-2xl">
        <div className="flex items-center space-x-3 mb-8">
          <Bell className="w-8 h-8 text-purple-300" />
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
        </div>

        <div className="space-y-8">
          {/* Notifications in-app */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Notifications de l'application</CardTitle>
              <CardDescription className="text-purple-200">
                Recevez vos notifications directement dans Jang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <div>
                    <Label className="text-white font-medium">Notifications dans l'application</Label>
                    <p className="text-purple-200 text-sm">Alertes et rappels via le navigateur</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.appNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('appNotifications', checked)}
                />
              </div>

              <Button
                onClick={testNotification}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Tester les notifications
              </Button>
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
