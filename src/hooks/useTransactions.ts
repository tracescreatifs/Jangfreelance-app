import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// ── Types exposés (camelCase) ─────────────────────────────────────────

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categorie: string;
  type: 'recette' | 'depense';
  montant: number;
  facture?: string;
  notes?: string;
  createdAt: string;
}

// ── Type Supabase (snake_case) ────────────────────────────────────────

interface TransactionRow {
  id: string;
  user_id: string;
  date: string;
  description: string;
  categorie: string;
  type: string;
  montant: number;
  facture: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Conversion ────────────────────────────────────────────────────────

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    categorie: row.categorie,
    type: row.type as Transaction['type'],
    montant: row.montant,
    facture: row.facture || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur chargement transactions:', error);
    } else {
      setTransactions((data || []).map(toTransaction));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transactionData: {
    date: string;
    description: string;
    categorie: string;
    type: 'recette' | 'depense';
    montant: number;
    facture?: string;
    notes?: string;
  }): Promise<Transaction> => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date: transactionData.date,
        description: transactionData.description,
        categorie: transactionData.categorie,
        type: transactionData.type,
        montant: transactionData.montant,
        facture: transactionData.facture || '',
        notes: transactionData.notes || '',
      })
      .select()
      .single();

    if (error) throw error;

    const newTransaction = toTransaction(data);
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const supabaseUpdates: Record<string, any> = {};
    if (updates.date !== undefined) supabaseUpdates.date = updates.date;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.categorie !== undefined) supabaseUpdates.categorie = updates.categorie;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.montant !== undefined) supabaseUpdates.montant = updates.montant;
    if (updates.facture !== undefined) supabaseUpdates.facture = updates.facture;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;

    const { error } = await supabase
      .from('transactions')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour transaction:', error);
      return;
    }

    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression transaction:', error);
      return;
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
  };
};
