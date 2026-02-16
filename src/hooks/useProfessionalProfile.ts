import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const LS_KEY = 'jang_professional_profile';

export interface ProfessionalProfile {
  nomCommercial: string;
  formeJuridique: string;
  secteurActivite: string;
  dateCreation: string;
  nombreEmployes: string;
  adresseRue: string;
  adresseVille: string;
  adresseRegion: string;
  adresseCodePostal: string;
  adressePays: string;
  emailProfessionnel: string;
  telephoneBureau: string;
  siteWeb: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  logoUrl?: string;
}

const defaultProfile: ProfessionalProfile = {
  nomCommercial: '',
  formeJuridique: '',
  secteurActivite: '',
  dateCreation: '',
  nombreEmployes: '',
  adresseRue: '',
  adresseVille: '',
  adresseRegion: '',
  adresseCodePostal: '',
  adressePays: '',
  emailProfessionnel: '',
  telephoneBureau: '',
  siteWeb: '',
  instagram: '',
  linkedin: '',
  facebook: '',
  logoUrl: '',
};

function saveToLocalStorage(profile: ProfessionalProfile): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save professional profile to localStorage:', e);
  }
}

function loadFromLocalStorage(): ProfessionalProfile | null {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...defaultProfile, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load professional profile from localStorage:', e);
  }
  return null;
}

function rowToProfile(row: any): ProfessionalProfile {
  return {
    nomCommercial: row.nom_commercial || row.company_name || '',
    formeJuridique: row.forme_juridique || '',
    secteurActivite: row.secteur_activite || '',
    dateCreation: row.date_creation || '',
    nombreEmployes: row.nombre_employes || '',
    adresseRue: row.adresse_pro_rue || row.address || '',
    adresseVille: row.adresse_pro_ville || row.city || '',
    adresseRegion: row.adresse_pro_region || '',
    adresseCodePostal: row.adresse_pro_code_postal || '',
    adressePays: row.adresse_pro_pays || row.country || '',
    emailProfessionnel: row.email_professionnel || '',
    telephoneBureau: row.telephone_bureau || row.phone || '',
    siteWeb: row.site_web || '',
    instagram: row.instagram || '',
    linkedin: row.linkedin || '',
    facebook: row.facebook || '',
    logoUrl: row.logo_url || '',
  };
}

function mergeProfiles(
  supabaseData: ProfessionalProfile | null,
  localData: ProfessionalProfile | null,
  fallback: ProfessionalProfile
): ProfessionalProfile {
  const result = { ...fallback };
  const keys = Object.keys(fallback) as (keyof ProfessionalProfile)[];

  for (const key of keys) {
    const supVal = supabaseData?.[key];
    const locVal = localData?.[key];
    (result as any)[key] = (supVal && supVal !== '') ? supVal : (locVal && locVal !== '') ? locVal : (fallback as any)[key];
  }

  return result;
}

export const useProfessionalProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile>(defaultProfile);
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
        console.warn('Supabase pro profile fetch (non-blocking):', error.message);
      }
    } catch (e) {
      console.warn('Supabase pro profile fetch timeout/error (non-blocking):', e);
    } finally {
      setLoading(false); // Garanti : loading passe à false quoi qu'il arrive
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<ProfessionalProfile>) => {
    if (!user) return;

    // 1. Update local state immediately
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);

    // 2. Always persist to localStorage (guaranteed)
    saveToLocalStorage(newProfile);

    // 3. Attempt Supabase upsert (best-effort)
    const supabaseUpdates: Record<string, any> = {};
    if (updates.nomCommercial !== undefined) supabaseUpdates.nom_commercial = updates.nomCommercial;
    if (updates.formeJuridique !== undefined) supabaseUpdates.forme_juridique = updates.formeJuridique;
    if (updates.secteurActivite !== undefined) supabaseUpdates.secteur_activite = updates.secteurActivite;
    if (updates.dateCreation !== undefined) supabaseUpdates.date_creation = updates.dateCreation;
    if (updates.nombreEmployes !== undefined) supabaseUpdates.nombre_employes = updates.nombreEmployes;
    if (updates.adresseRue !== undefined) supabaseUpdates.adresse_pro_rue = updates.adresseRue;
    if (updates.adresseVille !== undefined) supabaseUpdates.adresse_pro_ville = updates.adresseVille;
    if (updates.adresseRegion !== undefined) supabaseUpdates.adresse_pro_region = updates.adresseRegion;
    if (updates.adresseCodePostal !== undefined) supabaseUpdates.adresse_pro_code_postal = updates.adresseCodePostal;
    if (updates.adressePays !== undefined) supabaseUpdates.adresse_pro_pays = updates.adressePays;
    if (updates.emailProfessionnel !== undefined) supabaseUpdates.email_professionnel = updates.emailProfessionnel;
    if (updates.telephoneBureau !== undefined) supabaseUpdates.telephone_bureau = updates.telephoneBureau;
    if (updates.siteWeb !== undefined) supabaseUpdates.site_web = updates.siteWeb;
    if (updates.instagram !== undefined) supabaseUpdates.instagram = updates.instagram;
    if (updates.linkedin !== undefined) supabaseUpdates.linkedin = updates.linkedin;
    if (updates.facebook !== undefined) supabaseUpdates.facebook = updates.facebook;
    if (updates.logoUrl !== undefined) supabaseUpdates.logo_url = updates.logoUrl;

    supabaseUpdates.id = user.id;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(supabaseUpdates, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase pro upsert failed (data saved locally):', error.message);
      }
    } catch (e) {
      console.warn('Supabase pro upsert exception (data saved locally):', e);
    }
  };

  const updateLogo = async (file: File) => {
    if (!user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      await updateProfile({ logoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  return {
    profile,
    loading,
    updateProfile,
    updateLogo,
  };
};
