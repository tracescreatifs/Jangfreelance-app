import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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

function rowToProfile(row: any): ProfessionalProfile {
  return {
    nomCommercial: row.nom_commercial || '',
    formeJuridique: row.forme_juridique || '',
    secteurActivite: row.secteur_activite || '',
    dateCreation: row.date_creation || '',
    nombreEmployes: row.nombre_employes || '',
    adresseRue: row.adresse_pro_rue || '',
    adresseVille: row.adresse_pro_ville || '',
    adresseRegion: row.adresse_pro_region || '',
    adresseCodePostal: row.adresse_pro_code_postal || '',
    adressePays: row.adresse_pro_pays || '',
    emailProfessionnel: row.email_professionnel || '',
    telephoneBureau: row.telephone_bureau || '',
    siteWeb: row.site_web || '',
    instagram: row.instagram || '',
    linkedin: row.linkedin || '',
    facebook: row.facebook || '',
    logoUrl: row.logo_url || '',
  };
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

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('nom_commercial, forme_juridique, secteur_activite, date_creation, nombre_employes, adresse_pro_rue, adresse_pro_ville, adresse_pro_region, adresse_pro_code_postal, adresse_pro_pays, email_professionnel, telephone_bureau, site_web, instagram, linkedin, facebook, logo_url')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erreur chargement profil pro:', error);
    } else if (data) {
      setProfile(rowToProfile(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<ProfessionalProfile>) => {
    if (!user) return;

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

    const { error } = await supabase
      .from('profiles')
      .update(supabaseUpdates)
      .eq('id', user.id);

    if (error) {
      console.error('Erreur mise à jour profil pro:', error);
      return;
    }

    setProfile(prev => ({ ...prev, ...updates }));
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
