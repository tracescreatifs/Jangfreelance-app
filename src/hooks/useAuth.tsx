import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string;
  isAdmin: boolean;
  isReadOnly: boolean;
  licenseExpired: boolean;
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

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        checkLicenseExpiry(session.user.id);
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
        } else {
          setRole('user');
          setLicenseExpired(false);
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
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
          // On ne bloque pas l'inscription si le profil échoue
          // Le profil sera créé plus tard
        }
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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, role, isAdmin, isReadOnly, licenseExpired, signUp, signIn, signOut, resetPassword }}>
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
