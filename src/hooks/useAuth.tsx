import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/services/emailService';
import { LicenseGenerator } from '@/utils/licenseGenerator';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string;
  isAdmin: boolean;
  isReadOnly: boolean;
  licenseExpired: boolean;
  onboardingCompleted: boolean;
  setOnboardingComplete: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');
  const [licenseExpired, setLicenseExpired] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  const isAdmin = role === 'admin' || role === 'staff';
  const isReadOnly = licenseExpired && !isAdmin;

  const checkLicenseExpiry = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, end_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Pas de subscription = pas d'expiration a verifier
        setLicenseExpired(false);
        return;
      }

      // Verifier si la subscription est active mais expiree
      if (data.end_date) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        if (endDate < now) {
          setLicenseExpired(true);
          return;
        }
      }

      // Verifier le statut
      if (data.status === 'expired' || data.status === 'cancelled') {
        setLicenseExpired(true);
        return;
      }

      setLicenseExpired(false);
    } catch (err) {
      console.warn('[useAuth] checkLicenseExpiry error:', err);
      setLicenseExpired(false);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching role for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      console.log('[useAuth] Role query result:', { data, error });
      if (!error && data?.role) {
        console.log('[useAuth] Setting role to:', data.role);
        setRole(data.role);
      } else {
        console.log('[useAuth] No role found, defaulting to user. Error:', error);
        setRole('user');
      }
    } catch (err) {
      console.log('[useAuth] fetchUserRole exception:', err);
      setRole('user');
    }
  };

  const fetchOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setOnboardingCompleted(data.onboarding_completed ?? true);
      } else {
        setOnboardingCompleted(true);
      }
    } catch (err) {
      console.warn('[useAuth] fetchOnboardingStatus error:', err);
      setOnboardingCompleted(true);
    }
  };

  const setOnboardingComplete = async () => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      setOnboardingCompleted(true);
    } catch (err) {
      console.warn('[useAuth] setOnboardingComplete error:', err);
      setOnboardingCompleted(true);
    }
  };

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        checkLicenseExpiry(session.user.id);
        fetchOnboardingStatus(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
          checkLicenseExpiry(session.user.id);
          fetchOnboardingStatus(session.user.id);
        } else {
          setRole('user');
          setLicenseExpired(false);
          setOnboardingCompleted(true);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // 1. Créer le compte utilisateur
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      // 2. Créer le profil manuellement si l'utilisateur a été créé
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            onboarding_completed: false,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
          // On ne bloque pas l'inscription si le profil échoue
          // Le profil sera créé plus tard
        }

        // 2b. Assigner plan Gratuit avec licence 3 mois (non-bloquant)
        try {
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', 'free')
            .single();

          if (freePlan) {
            const durationMonths = 3;
            const licenseInfo = LicenseGenerator.generateLicenseKey('STARTER', durationMonths);

            await supabase.from('license_keys').insert({
              key: licenseInfo.key,
              plan_id: freePlan.id,
              duration_months: durationMonths,
              is_used: true,
              used_by: data.user.id,
              used_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

            await supabase.from('subscriptions').upsert({
              user_id: data.user.id,
              plan_id: freePlan.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: expiryDate.toISOString(),
              license_key: licenseInfo.key,
            }, { onConflict: 'user_id' });
          } else {
            console.warn('[useAuth] Plan gratuit (slug=free) non trouvé dans subscription_plans');
          }
        } catch (licenseErr) {
          console.warn('[useAuth] Auto-license error:', licenseErr);
        }

        // 3. Envoyer email de bienvenue (non-bloquant)
        sendWelcomeEmail(email, fullName)
          .catch(err => console.warn('[useAuth] Welcome email error:', err));
      }

      return { error: null };
    } catch (err) {
      console.error('Erreur inscription:', err);
      return { error: { message: 'Erreur lors de l\'inscription' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, role, isAdmin, isReadOnly, licenseExpired, onboardingCompleted, setOnboardingComplete, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
