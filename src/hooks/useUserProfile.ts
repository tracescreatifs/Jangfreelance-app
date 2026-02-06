import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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

function rowToProfile(row: any): UserProfile {
  return {
    prenom: row.prenom || '',
    nom: row.nom || '',
    email: row.email || '',
    telephone: row.telephone || '',
    dateNaissance: row.date_naissance || '',
    adresseRue: row.adresse_rue || '',
    adresseVille: row.adresse_ville || '',
    adresseCodePostal: row.adresse_code_postal || '',
    adressePays: row.adresse_pays || '',
    bioDescription: row.bio_description || '',
    specialites: row.specialites || [],
    photoUrl: row.photo_url || '',
  };
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

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('prenom, nom, email, telephone, date_naissance, adresse_rue, adresse_ville, adresse_code_postal, adresse_pays, bio_description, specialites, photo_url')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erreur chargement profil:', error);
    } else if (data) {
      setProfile(rowToProfile(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

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

    const { error } = await supabase
      .from('profiles')
      .update(supabaseUpdates)
      .eq('id', user.id);

    if (error) {
      console.error('Erreur mise à jour profil:', error);
      return;
    }

    setProfile(prev => ({ ...prev, ...updates }));
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

    // Upload vers Supabase Storage (fallback base64 si pas de bucket)
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
