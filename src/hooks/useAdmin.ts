import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LicenseGenerator } from '@/utils/licenseGenerator';

// ─── Interfaces ───────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_login: string | null;
  subscription_status: string | null;
  plan_name: string | null;
  ninea: string | null;
  rccm: string | null;
  regime_fiscal: string | null;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  provider: string;
  status: string;
  plan_name: string;
  created_at: string;
}

export interface AdminLicense {
  id: string;
  key: string;
  plan_id: string;
  plan_name: string;
  duration_months: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  client_name: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────

export const useAdmin = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [licenses, setLicenses] = useState<AdminLicense[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all users with their subscription info ──────────

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.warn('Admin: failed to fetch profiles:', error.message);
        return;
      }

      if (!profiles) return;

      // For each user, fetch their latest subscription
      const enriched: AdminUser[] = await Promise.all(
        profiles.map(async (profile: any) => {
          let subscription_status: string | null = null;
          let plan_name: string | null = null;
          let ninea: string | null = null;
          let rccm: string | null = null;
          let regime_fiscal: string | null = null;

          try {
            const { data: sub, error: subError } = await supabase
              .from('subscriptions')
              .select('status, subscription_plans(name)')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!subError && sub) {
              subscription_status = sub.status || null;
              const planData = sub.subscription_plans as any;
              plan_name = planData?.name || null;
            }
          } catch {
            // Non-blocking: skip subscription info for this user
          }

          try {
            const { data: fiscal, error: fiscalError } = await supabase
              .from('fiscal_config')
              .select('ninea, rccm, regime_fiscal')
              .eq('user_id', profile.id)
              .maybeSingle();

            if (!fiscalError && fiscal) {
              ninea = fiscal.ninea || null;
              rccm = fiscal.rccm || null;
              regime_fiscal = fiscal.regime_fiscal || null;
            }
          } catch {
            // Non-blocking: skip fiscal info for this user
          }

          return {
            id: profile.id,
            email: profile.email || '',
            full_name: profile.full_name || '',
            role: profile.role || 'user',
            created_at: profile.created_at || '',
            last_login: profile.last_login || null,
            subscription_status,
            plan_name,
            ninea,
            rccm,
            regime_fiscal,
          };
        })
      );

      setUsers(enriched);
    } catch (e) {
      console.warn('Admin: fetchAllUsers error:', e);
    }
  }, []);

  // ── Fetch all payments ────────────────────────────────────

  const fetchAllPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Admin: failed to fetch payments:', error.message);
        return;
      }

      if (!data) return;

      // Enrich with user email from local users state won't work here (async timing),
      // so we fetch profiles separately
      const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))];
      let emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        if (profiles) {
          emailMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.email || '']));
        }
      }

      const mapped: AdminPayment[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id || '',
        user_email: emailMap[row.user_id] || '',
        amount: row.amount || 0,
        provider: row.provider || '',
        status: row.status || '',
        plan_name: row.description || '',
        created_at: row.created_at || '',
      }));

      setPayments(mapped);
    } catch (e) {
      console.warn('Admin: fetchAllPayments error:', e);
    }
  }, []);

  // ── Fetch all license keys ────────────────────────────────

  const fetchAllLicenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*, subscription_plans(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Admin: failed to fetch license keys:', error.message);
        return;
      }

      if (!data) return;

      const mapped: AdminLicense[] = data.map((row: any) => ({
        id: row.id,
        key: row.key || '',
        plan_id: row.plan_id || '',
        plan_name: (row.subscription_plans as any)?.name || '',
        duration_months: row.duration_months || 0,
        is_used: row.is_used || false,
        used_by: row.used_by || null,
        used_at: row.used_at || null,
        created_at: row.created_at || '',
        client_name: row.client_name || null,
      }));

      setLicenses(mapped);
    } catch (e) {
      console.warn('Admin: fetchAllLicenses error:', e);
    }
  }, []);

  // ── Fetch subscription plans ──────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.warn('Admin: failed to fetch plans:', error.message);
        return;
      }

      setPlans(data || []);
    } catch (e) {
      console.warn('Admin: fetchPlans error:', e);
    }
  }, []);

  // ── Auto-fetch on mount ───────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAllUsers(),
          fetchAllPayments(),
          fetchAllLicenses(),
          fetchPlans(),
        ]);
      } catch (e) {
        console.warn('Admin: initial fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [fetchAllUsers, fetchAllPayments, fetchAllLicenses, fetchPlans]);

  // ── Actions ───────────────────────────────────────────────

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.warn('Admin: updateUserRole error:', error.message);
        throw error;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (e) {
      console.warn('Admin: updateUserRole exception:', e);
      throw e;
    }
  };

  const revokeSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (error) {
        console.warn('Admin: revokeSubscription error:', error.message);
        throw error;
      }

      // Refresh users to reflect the change
      await fetchAllUsers();
    } catch (e) {
      console.warn('Admin: revokeSubscription exception:', e);
      throw e;
    }
  };

  const grantFreeLicense = async (
    userId: string,
    planId: string,
    durationMonths: number
  ) => {
    try {
      // Find the plan to determine the plan name for key generation
      const plan = plans.find((p: any) => p.id === planId);
      const planName = plan?.name?.toUpperCase() || 'PRO';

      // Map plan name to LicenseGenerator plan type
      let licenseType: 'STARTER' | 'PRO' | 'ENTERPRISE' = 'PRO';
      if (planName.includes('STARTER') || planName.includes('START')) {
        licenseType = 'STARTER';
      } else if (planName.includes('ENTERPRISE') || planName.includes('ENT')) {
        licenseType = 'ENTERPRISE';
      }

      // Generate license key
      const licenseInfo = LicenseGenerator.generateLicenseKey(
        licenseType,
        durationMonths
      );

      // Insert license key into database
      const { error: insertError } = await supabase
        .from('license_keys')
        .insert({
          key: licenseInfo.key,
          plan_id: planId,
          duration_months: durationMonths,
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.warn('Admin: grantFreeLicense insert error:', insertError.message);
        throw insertError;
      }

      // Activate subscription for the user
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: expiryDate.toISOString(),
            license_key: licenseInfo.key,
          },
          { onConflict: 'user_id' }
        );

      if (subError) {
        console.warn('Admin: grantFreeLicense subscription error:', subError.message);
        throw subError;
      }

      // Refresh data
      await Promise.all([fetchAllUsers(), fetchAllLicenses()]);
    } catch (e) {
      console.warn('Admin: grantFreeLicense exception:', e);
      throw e;
    }
  };

  // ── Delete a license key ─────────────────────────────────

  const deleteLicense = async (licenseId: string) => {
    try {
      const { error } = await supabase
        .from('license_keys')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', licenseId);

      if (error) {
        console.warn('Admin: deleteLicense error:', error.message);
        throw error;
      }

      // Update local state
      setLicenses((prev) => prev.filter((l) => l.id !== licenseId));
    } catch (e) {
      console.warn('Admin: deleteLicense exception:', e);
      throw e;
    }
  };

  // ── KPI computed values ───────────────────────────────────

  const totalUsers = useMemo(() => users.length, [users]);

  const activeUsers = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return users.filter((u) => {
      if (!u.last_login) return true; // Count users without last_login tracking
      return new Date(u.last_login) >= thirtyDaysAgo;
    }).length;
  }, [users]);

  const totalRevenue = useMemo(() => {
    return payments
      .filter(
        (p) =>
          p.status.toLowerCase().includes('completed') ||
          p.status.toLowerCase().includes('success')
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return payments
      .filter((p) => {
        const d = new Date(p.created_at);
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear &&
          (p.status.toLowerCase().includes('completed') ||
            p.status.toLowerCase().includes('success'))
        );
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const churnRate = useMemo(() => {
    const totalSubscriptions = users.filter(
      (u) => u.subscription_status !== null
    ).length;
    if (totalSubscriptions === 0) return 0;

    const cancelled = users.filter(
      (u) => u.subscription_status === 'cancelled'
    ).length;

    return (cancelled / totalSubscriptions) * 100;
  }, [users]);

  const activationRate = useMemo(() => {
    if (users.length === 0) return 0;

    const activeSubscriptions = users.filter(
      (u) => u.subscription_status === 'active'
    ).length;

    return (activeSubscriptions / users.length) * 100;
  }, [users]);

  // ── Return ────────────────────────────────────────────────

  return {
    // State
    users,
    payments,
    licenses,
    plans,
    loading,

    // Fetch functions
    fetchAllUsers,
    fetchAllPayments,
    fetchAllLicenses,
    fetchPlans,

    // Actions
    updateUserRole,
    revokeSubscription,
    grantFreeLicense,
    deleteLicense,

    // KPI
    totalUsers,
    activeUsers,
    totalRevenue,
    monthlyRevenue,
    churnRate,
    activationRate,
  };
};
