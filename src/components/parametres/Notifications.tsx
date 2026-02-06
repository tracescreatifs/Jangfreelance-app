
import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Calendar, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const Notifications = () => {
  const [preferences, setPreferences] = useState({
    // Notifications push
    browserNotifications: true,
    desktopNotifications: false,
    
    // Email
    emailNotifications: true,
    emailFrequency: 'instant',
    
    // Types de notifications
    newProject: true,
    projectDeadline: true,
    invoiceOverdue: true,
    paymentReceived: true,
    clientMessages: true,
    systemUpdates: false,
    
    // Horaires
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
    weekendNotifications: false,
    
    // Canaux
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
  });

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const emailFrequencies = [
    { value: 'instant', label: 'Instantané' },
    { value: 'hourly', label: 'Toutes les heures' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'never', label: 'Jamais' },
  ];

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

  const handleSave = () => {
    console.log('Sauvegarde préférences notifications:', preferences);
  };

  const testNotification = () => {
    console.log('Test de notification');
    if (preferences.browserNotifications && 'Notification' in window) {
      new Notification('FreelanceHub Studio', {
        body: 'Ceci est une notification de test !',
        icon: '/favicon.ico'
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
          {/* Canaux de notification */}
          <Card className="glass-morphism border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Canaux de notification</CardTitle>
              <CardDescription className="text-purple-200">
                Choisissez comment recevoir vos notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <Label className="text-white font-medium">Email</Label>
                      <p className="text-purple-200 text-sm">alex@example.com</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('emailEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <div>
                      <Label className="text-white font-medium">SMS</Label>
                      <p className="text-purple-200 text-sm">+221 77 *** **67</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.smsEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('smsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label className="text-white font-medium">Push</Label>
                      <p className="text-purple-200 text-sm">Navigateur</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('pushEnabled', checked)}
                  />
                </div>
              </div>

              {preferences.emailEnabled && (
                <div>
                  <Label className="text-white font-medium">Fréquence des emails</Label>
                  <Select 
                    value={preferences.emailFrequency} 
                    onValueChange={(value) => handlePreferenceChange('emailFrequency', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {emailFrequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value} className="text-white hover:bg-gray-700">
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <div className="grid grid-cols-2 gap-4">
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

export default Notifications;
