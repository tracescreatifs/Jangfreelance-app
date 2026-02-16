import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const LS_KEY = 'jang_user_profile';

export interface UserProfile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresseRue: string;
  adresseVille: string;
  adresseCodePostal: string;
  adressePays: string;
  bioDescription: string;
  specialites: string[];
  photoUrl?: string;
}

const defaultProfile: UserProfile = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  adresseRue: '',
  adresseVille: '',
  adresseCodePostal: '',
  adressePays: '',
  bioDescription: '',
  specialites: [],
  photoUrl: '',
};

function saveToLocalStorage(profile: UserProfile): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save user profile to localStorage:', e);
  }
}

function loadFromLocalStorage(): UserProfile | null {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...defaultProfile, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load user profile from localStorage:', e);
  }
  return null;
}

function rowToProfile(row: any): UserProfile {
  return {
    prenom: row.prenom || '',
    nom: row.nom || '',
    email: row.email || '',
    telephone: row.telephone || row.phone || '',
    dateNaissance: row.date_naissance || '',
    adresseRue: row.adresse_rue || row.address || '',
    adresseVille: row.adresse_ville || row.city || '',
    adresseCodePostal: row.adresse_code_postal || '',
    adressePays: row.adresse_pays || row.country || '',
    bioDescription: row.bio_description || '',
    specialites: row.specialites || [],
    photoUrl: row.photo_url || row.logo_url || '',
  };
}

function mergeProfiles(
  supabaseData: UserProfile | null,
  localData: UserProfile | null,
  fallback: UserProfile
): UserProfile {
  const result = { ...fallback };
  const keys = Object.keys(fallback) as (keyof UserProfile)[];

  for (const key of keys) {
    const supVal = supabaseData?.[key];
    const locVal = localData?.[key];

    if (key === 'specialites') {
      const supArr = supVal as string[] | undefined;
      const locArr = locVal as string[] | undefined;
      result[key] = (supArr && supArr.length > 0) ? supArr : (locArr && locArr.length > 0) ? locArr : [];
    } else {
      (result as any)[key] = (supVal && supVal !== '') ? supVal : (locVal && locVal !== '') ? locVal : (fallback as any)[key];
    }
  }

  return result;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Load localStorage IMMÉDIATEMENT → débloquer l'UI tout de suite
    const localProfile = loadFromLocalStorage();
    if (localProfile) {
      setProfile(localProfile);
      setLoading(false); // L'UI s'affiche MAINTENANT avec les données locales
    }

    // 2. Fetch Supabase en arrière-plan (avec timeout de 5s)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (!error && data) {
        const supabaseProfile = rowToProfile(data);
        const merged = mergeProfiles(supabaseProfile, localProfile, defaultProfile);
        setProfile(merged);
        saveToLocalStorage(merged);
      } else if (error) {
        console.warn('Supabase profile fetch (non-blocking):', error.message);
      }
    } catch (e) {
      console.warn('Supabase profile fetch timeout/error (non-blocking):', e);
    } finally {
      setLoading(false); // Garanti : loading passe à false quoi qu'il arrive
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    // 1. Update local state immediately
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);

    // 2. Always persist to localStorage (guaranteed)
    saveToLocalStorage(newProfile);

    // 3. Attempt Supabase upsert (best-effort)
    const supabaseUpdates: Record<string, any> = {};
    if (updates.prenom !== undefined) supabaseUpdates.prenom = updates.prenom;
    if (updates.nom !== undefined) supabaseUpdates.nom = updates.nom;
    if (updates.email !== undefined) supabaseUpdates.email = updates.email;
    if (updates.telephone !== undefined) supabaseUpdates.telephone = updates.telephone;
    if (updates.dateNaissance !== undefined) supabaseUpdates.date_naissance = updates.dateNaissance;
    if (updates.adresseRue !== undefined) supabaseUpdates.adresse_rue = updates.adresseRue;
    if (updates.adresseVille !== undefined) supabaseUpdates.adresse_ville = updates.adresseVille;
    if (updates.adresseCodePostal !== undefined) supabaseUpdates.adresse_code_postal = updates.adresseCodePostal;
    if (updates.adressePays !== undefined) supabaseUpdates.adresse_pays = updates.adressePays;
    if (updates.bioDescription !== undefined) supabaseUpdates.bio_description = updates.bioDescription;
    if (updates.specialites !== undefined) supabaseUpdates.specialites = updates.specialites;
    if (updates.photoUrl !== undefined) supabaseUpdates.photo_url = updates.photoUrl;

    supabaseUpdates.id = user.id;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(supabaseUpdates, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase upsert failed (data saved locally):', error.message);
      }
    } catch (e) {
      console.warn('Supabase upsert exception (data saved locally):', e);
    }
  };

  const addSpecialite = async (specialite: string) => {
    const trimmed = specialite.trim();
    if (!trimmed || profile.specialites.includes(trimmed)) return;
    const newSpecialites = [...profile.specialites, trimmed];
    await updateProfile({ specialites: newSpecialites });
  };

  const removeSpecialite = async (index: number) => {
    const newSpecialites = profile.specialites.filter((_, i) => i !== index);
    await updateProfile({ specialites: newSpecialites });
  };

  const updatePhoto = async (file: File) => {
    if (!user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      await updateProfile({ photoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  return {
    profile,
    loading,
    updateProfile,
    addSpecialite,
    removeSpecialite,
    updatePhoto,
  };
};
