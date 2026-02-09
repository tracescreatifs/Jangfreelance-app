import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface FiscalConfig {
  paysExercice: string;
  regimeFiscal: string;
  caPrevisionnelAnnuel: string;
  ninea: string;
  rccm: string;
  numeroTVA: string;
  banque: string;
  iban: string;
  swift: string;
}

const defaultConfig: FiscalConfig = {
  paysExercice: 'Sénégal',
  regimeFiscal: 'BRS',
  caPrevisionnelAnnuel: '',
  ninea: '',
  rccm: '',
  numeroTVA: '',
  banque: '',
  iban: '',
  swift: '',
};

export const useFiscalConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<FiscalConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur chargement config fiscale:', error);
    } else if (data) {
      setConfig({
        paysExercice: data.pays_exercice || 'Sénégal',
        regimeFiscal: data.regime_fiscal || 'BRS',
        caPrevisionnelAnnuel: data.ca_previsionnel_annuel || '',
        ninea: data.ninea || '',
        rccm: data.rccm || '',
        numeroTVA: data.numero_tva || '',
        banque: data.banque || '',
        iban: data.iban || '',
        swift: data.swift || '',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<FiscalConfig>) => {
    if (!user) return;

    const supabaseUpdates: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (updates.paysExercice !== undefined) supabaseUpdates.pays_exercice = updates.paysExercice;
    if (updates.regimeFiscal !== undefined) supabaseUpdates.regime_fiscal = updates.regimeFiscal;
    if (updates.caPrevisionnelAnnuel !== undefined) supabaseUpdates.ca_previsionnel_annuel = updates.caPrevisionnelAnnuel;
    if (updates.ninea !== undefined) supabaseUpdates.ninea = updates.ninea;
    if (updates.rccm !== undefined) supabaseUpdates.rccm = updates.rccm;
    if (updates.numeroTVA !== undefined) supabaseUpdates.numero_tva = updates.numeroTVA;
    if (updates.banque !== undefined) supabaseUpdates.banque = updates.banque;
    if (updates.iban !== undefined) supabaseUpdates.iban = updates.iban;
    if (updates.swift !== undefined) supabaseUpdates.swift = updates.swift;

    const { error } = await supabase
      .from('fiscal_config')
      .upsert(supabaseUpdates, { onConflict: 'user_id' });

    if (error) {
      console.error('Erreur mise à jour config fiscale:', error);
      throw error;
    }

    setConfig(prev => ({ ...prev, ...updates }));
  };

  return {
    config,
    loading,
    updateConfig,
  };
};
