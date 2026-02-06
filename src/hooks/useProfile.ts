import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  siret?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si le profil n'existe pas, on le crée
        if (error.code === 'PGRST116') {
          const newProfile = {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(createdProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: 'Non authentifié' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const uploadLogo = async (file: File) => {
    if (!user) return { error: 'Non authentifié' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour le profil avec l'URL du logo
      await updateProfile({ logo_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Erreur lors de l\'upload du logo:', err);
      return { url: null, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadLogo,
    refetch: fetchProfile
  };
}
