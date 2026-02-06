import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: {
    max_clients: number;
    max_projects: number;
    max_invoices_per_month: number;
    multi_users?: boolean;
    api_access?: boolean;
  };
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  licenseKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  provider: string;
  providerTransactionId?: string;
  description?: string;
  createdAt: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les plans disponibles
  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;

      const transformedPlans: SubscriptionPlan[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        priceMonthly: plan.price_monthly,
        priceYearly: plan.price_yearly,
        currency: plan.currency,
        features: plan.features || [],
        limits: plan.limits || {},
        isActive: plan.is_active
      }));

      setPlans(transformedPlans);
    } catch (err) {
      console.error('Erreur chargement plans:', err);
    }
  }, []);

  // Récupérer l'abonnement de l'utilisateur
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const transformed: Subscription = {
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          plan: data.plan ? {
            id: data.plan.id,
            name: data.plan.name,
            slug: data.plan.slug,
            priceMonthly: data.plan.price_monthly,
            priceYearly: data.plan.price_yearly,
            currency: data.plan.currency,
            features: data.plan.features || [],
            limits: data.plan.limits || {},
            isActive: data.plan.is_active
          } : undefined,
          status: data.status,
          billingCycle: data.billing_cycle,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          licenseKey: data.license_key,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setSubscription(transformed);
      }
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
      setError('Erreur lors du chargement de l\'abonnement');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Récupérer l'historique des paiements
  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPayments: Payment[] = (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        subscriptionId: p.subscription_id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.payment_method,
        provider: p.provider,
        providerTransactionId: p.provider_transaction_id,
        description: p.description,
        createdAt: p.created_at
      }));

      setPayments(transformedPayments);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
    }
  }, [user]);

  // Activer une clé de licence
  const activateLicenseKey = useCallback(async (licenseKey: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Non connecté' };

    try {
      // Vérifier la clé
      const { data: keyData, error: keyError } = await supabase
        .from('license_keys')
        .select('*, plan:subscription_plans(*)')
        .eq('key', licenseKey.toUpperCase().trim())
        .single();

      if (keyError || !keyData) {
        return { success: false, message: 'Clé de licence invalide' };
      }

      if (keyData.is_used) {
        return { success: false, message: 'Cette clé a déjà été utilisée' };
      }

      // Calculer la date de fin
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + keyData.duration_months);

      // Mettre à jour ou créer l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: keyData.plan_id,
          status: 'active',
          billing_cycle: keyData.duration_months >= 12 ? 'yearly' : 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          license_key: licenseKey.toUpperCase().trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subError) throw subError;

      // Marquer la clé comme utilisée
      const { error: updateKeyError } = await supabase
        .from('license_keys')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('id', keyData.id);

      if (updateKeyError) throw updateKeyError;

      // Enregistrer le paiement (gratuit car licence)
      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: 0,
          currency: 'XOF',
          status: 'completed',
          payment_method: 'license_key',
          provider: 'license',
          provider_transaction_id: licenseKey,
          description: `Activation licence ${keyData.plan.name} - ${keyData.duration_months} mois`
        });

      await fetchSubscription();
      await fetchPayments();

      return {
        success: true,
        message: `Plan ${keyData.plan.name} activé pour ${keyData.duration_months} mois !`
      };
    } catch (err) {
      console.error('Erreur activation licence:', err);
      return { success: false, message: 'Erreur lors de l\'activation' };
    }
  }, [user, fetchSubscription, fetchPayments]);

  // Mettre à jour l'abonnement après paiement PayDunya
  const updateSubscriptionAfterPayment = useCallback(async (
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    paymentData: {
      transactionId: string;
      paymentMethod: string;
      amount: number;
    }
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Non connecté' };

    try {
      // Calculer la date de fin
      const endDate = new Date();
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Mettre à jour l'abonnement
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (subError) throw subError;

      // Enregistrer le paiement
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          subscription_id: subData.id,
          amount: paymentData.amount,
          currency: 'XOF',
          status: 'completed',
          payment_method: paymentData.paymentMethod,
          provider: 'paydunya',
          provider_transaction_id: paymentData.transactionId,
          description: `Abonnement ${billingCycle === 'yearly' ? 'annuel' : 'mensuel'}`
        });

      if (payError) throw payError;

      await fetchSubscription();
      await fetchPayments();

      return { success: true, message: 'Abonnement activé avec succès !' };
    } catch (err) {
      console.error('Erreur mise à jour abonnement:', err);
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }, [user, fetchSubscription, fetchPayments]);

  // Annuler l'abonnement
  const cancelSubscription = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user || !subscription) return { success: false, message: 'Pas d\'abonnement actif' };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchSubscription();
      return {
        success: true,
        message: 'Votre abonnement sera annulé à la fin de la période en cours'
      };
    } catch (err) {
      console.error('Erreur annulation:', err);
      return { success: false, message: 'Erreur lors de l\'annulation' };
    }
  }, [user, subscription, fetchSubscription]);

  // Vérifier les limites du plan
  const checkLimit = useCallback((type: 'clients' | 'projects' | 'invoices', currentCount: number): boolean => {
    if (!subscription?.plan?.limits) return true;

    const limits = subscription.plan.limits;

    switch (type) {
      case 'clients':
        return limits.max_clients === -1 || currentCount < limits.max_clients;
      case 'projects':
        return limits.max_projects === -1 || currentCount < limits.max_projects;
      case 'invoices':
        return limits.max_invoices_per_month === -1 || currentCount < limits.max_invoices_per_month;
      default:
        return true;
    }
  }, [subscription]);

  // Vérifier si le plan est Pro ou supérieur
  const isPro = useCallback((): boolean => {
    return subscription?.plan?.slug === 'pro' || subscription?.plan?.slug === 'business';
  }, [subscription]);

  // Vérifier si le plan est Business
  const isBusiness = useCallback((): boolean => {
    return subscription?.plan?.slug === 'business';
  }, [subscription]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchSubscription();
    fetchPayments();
  }, [fetchSubscription, fetchPayments]);

  return {
    subscription,
    plans,
    payments,
    loading,
    error,
    activateLicenseKey,
    updateSubscriptionAfterPayment,
    cancelSubscription,
    checkLimit,
    isPro,
    isBusiness,
    refreshSubscription: fetchSubscription,
    refreshPayments: fetchPayments
  };
};
