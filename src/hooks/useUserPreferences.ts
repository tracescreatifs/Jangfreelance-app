import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  // Personnalisation
  theme: string;
  couleurPrincipale: string;
  // Localisation
  langue: string;
  fuseauHoraire: string;
  formatDate: string;
  formatHeure: string;
  devise: string;
  // Notifications
  notificationsEmail: boolean;
  notificationsPush: boolean;
  notificationsRappels: boolean;
  rappelFacturesJours: number;
  notificationsNewClient: boolean;
  notificationsPayment: boolean;
  // Préférences métier
  tauxHoraireDefaut: number;
  delaiPaiementDefaut: number;
  mentionsLegalesDefaut: string;
  conditionsGenerales: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  couleurPrincipale: '#8B5CF6',
  langue: 'fr',
  fuseauHoraire: 'Africa/Dakar',
  formatDate: 'DD/MM/YYYY',
  formatHeure: '24h',
  devise: 'XOF',
  notificationsEmail: true,
  notificationsPush: true,
  notificationsRappels: true,
  rappelFacturesJours: 7,
  notificationsNewClient: true,
  notificationsPayment: true,
  tauxHoraireDefaut: 15000,
  delaiPaiementDefaut: 30,
  mentionsLegalesDefaut: '',
  conditionsGenerales: '',
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur chargement préférences:', error);
    } else if (data) {
      setPreferences({
        theme: data.theme || 'dark',
        couleurPrincipale: data.couleur_principale || '#8B5CF6',
        langue: data.langue || 'fr',
        fuseauHoraire: data.fuseau_horaire || 'Africa/Dakar',
        formatDate: data.format_date || 'DD/MM/YYYY',
        formatHeure: data.format_heure || '24h',
        devise: data.devise || 'XOF',
        notificationsEmail: data.notifications_email ?? true,
        notificationsPush: data.notifications_push ?? true,
        notificationsRappels: data.notifications_rappels ?? true,
        rappelFacturesJours: data.rappel_factures_jours || 7,
        notificationsNewClient: data.notifications_new_client ?? true,
        notificationsPayment: data.notifications_payment ?? true,
        tauxHoraireDefaut: data.taux_horaire_defaut || 15000,
        delaiPaiementDefaut: data.delai_paiement_defaut || 30,
        mentionsLegalesDefaut: data.mentions_legales_defaut || '',
        conditionsGenerales: data.conditions_generales || '',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    const supabaseUpdates: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (updates.theme !== undefined) supabaseUpdates.theme = updates.theme;
    if (updates.couleurPrincipale !== undefined) supabaseUpdates.couleur_principale = updates.couleurPrincipale;
    if (updates.langue !== undefined) supabaseUpdates.langue = updates.langue;
    if (updates.fuseauHoraire !== undefined) supabaseUpdates.fuseau_horaire = updates.fuseauHoraire;
    if (updates.formatDate !== undefined) supabaseUpdates.format_date = updates.formatDate;
    if (updates.formatHeure !== undefined) supabaseUpdates.format_heure = updates.formatHeure;
    if (updates.devise !== undefined) supabaseUpdates.devise = updates.devise;
    if (updates.notificationsEmail !== undefined) supabaseUpdates.notifications_email = updates.notificationsEmail;
    if (updates.notificationsPush !== undefined) supabaseUpdates.notifications_push = updates.notificationsPush;
    if (updates.notificationsRappels !== undefined) supabaseUpdates.notifications_rappels = updates.notificationsRappels;
    if (updates.rappelFacturesJours !== undefined) supabaseUpdates.rappel_factures_jours = updates.rappelFacturesJours;
    if (updates.notificationsNewClient !== undefined) supabaseUpdates.notifications_new_client = updates.notificationsNewClient;
    if (updates.notificationsPayment !== undefined) supabaseUpdates.notifications_payment = updates.notificationsPayment;
    if (updates.tauxHoraireDefaut !== undefined) supabaseUpdates.taux_horaire_defaut = updates.tauxHoraireDefaut;
    if (updates.delaiPaiementDefaut !== undefined) supabaseUpdates.delai_paiement_defaut = updates.delaiPaiementDefaut;
    if (updates.mentionsLegalesDefaut !== undefined) supabaseUpdates.mentions_legales_defaut = updates.mentionsLegalesDefaut;
    if (updates.conditionsGenerales !== undefined) supabaseUpdates.conditions_generales = updates.conditionsGenerales;

    const { error } = await supabase
      .from('user_preferences')
      .upsert(supabaseUpdates, { onConflict: 'user_id' });

    if (error) {
      console.error('Erreur mise à jour préférences:', error);
      throw error;
    }

    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return {
    preferences,
    loading,
    updatePreferences,
  };
};
