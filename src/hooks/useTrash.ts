import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────

export type TrashItemType = 'client' | 'project' | 'invoice' | 'transaction' | 'license';

export interface TrashItem {
  id: string;
  type: TrashItemType;
  name: string;
  details: string;
  deleted_at: string;
}

const TYPE_LABELS: Record<TrashItemType, string> = {
  client: 'Client',
  project: 'Projet',
  invoice: 'Facture',
  transaction: 'Transaction',
  license: 'Licence',
};

const TYPE_TABLES: Record<TrashItemType, string> = {
  client: 'clients',
  project: 'projects',
  invoice: 'invoices',
  transaction: 'transactions',
  license: 'license_keys',
};

// ── Hook ─────────────────────────────────────────────────────

export const useTrash = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger tous les elements dans la corbeille
  const fetchTrashItems = useCallback(async () => {
    setLoading(true);
    const allItems: TrashItem[] = [];

    try {
      // Clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, deleted_at')
        .not('deleted_at', 'is', null);
      if (clients) {
        clients.forEach((c: any) => {
          allItems.push({
            id: c.id,
            type: 'client',
            name: c.name || 'Client sans nom',
            details: c.email || '',
            deleted_at: c.deleted_at,
          });
        });
      }

      // Projets
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, client_name, deleted_at')
        .not('deleted_at', 'is', null);
      if (projects) {
        projects.forEach((p: any) => {
          allItems.push({
            id: p.id,
            type: 'project',
            name: p.name || 'Projet sans nom',
            details: p.client_name || '',
            deleted_at: p.deleted_at,
          });
        });
      }

      // Factures
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, number, type, client_name, total, deleted_at')
        .not('deleted_at', 'is', null);
      if (invoices) {
        invoices.forEach((inv: any) => {
          const typeLabel = inv.type === 'devis' ? 'Devis' : 'Facture';
          allItems.push({
            id: inv.id,
            type: 'invoice',
            name: `${typeLabel} ${inv.number || ''}`.trim(),
            details: `${inv.client_name || ''} — ${new Intl.NumberFormat('fr-FR').format(inv.total || 0)} XOF`,
            deleted_at: inv.deleted_at,
          });
        });
      }

      // Transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, description, montant, type, deleted_at')
        .not('deleted_at', 'is', null);
      if (transactions) {
        transactions.forEach((t: any) => {
          allItems.push({
            id: t.id,
            type: 'transaction',
            name: t.description || 'Transaction',
            details: `${t.type === 'recette' ? '+' : '-'}${new Intl.NumberFormat('fr-FR').format(t.montant || 0)} XOF`,
            deleted_at: t.deleted_at,
          });
        });
      }

      // Licences
      const { data: licenses } = await supabase
        .from('license_keys')
        .select('id, key, client_name, deleted_at')
        .not('deleted_at', 'is', null);
      if (licenses) {
        licenses.forEach((l: any) => {
          allItems.push({
            id: l.id,
            type: 'license',
            name: l.key || 'Licence',
            details: l.client_name || '',
            deleted_at: l.deleted_at,
          });
        });
      }

      // Trier par date de suppression (plus recent en premier)
      allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      setItems(allItems);
    } catch (err) {
      console.warn('useTrash: fetchTrashItems error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restaurer un element
  const restoreItem = async (type: TrashItemType, id: string) => {
    const table = TYPE_TABLES[type];
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      console.warn(`useTrash: restore ${type} error:`, error.message);
      throw error;
    }

    setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  };

  // Supprimer definitivement
  const permanentDelete = async (type: TrashItemType, id: string) => {
    const table = TYPE_TABLES[type];
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`useTrash: permanentDelete ${type} error:`, error.message);
      throw error;
    }

    setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  };

  // Vider toute la corbeille
  const emptyTrash = async () => {
    const tables = Object.values(TYPE_TABLES);
    for (const table of tables) {
      await supabase
        .from(table)
        .delete()
        .not('deleted_at', 'is', null);
    }
    setItems([]);
  };

  return {
    items,
    loading,
    typeLabels: TYPE_LABELS,
    fetchTrashItems,
    restoreItem,
    permanentDelete,
    emptyTrash,
  };
};
