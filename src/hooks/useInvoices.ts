import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// ── Types exposés aux composants (camelCase) ──────────────────────────

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  type: 'devis' | 'facture';
  title: string;
  subtitle?: string;
  clientName: string;
  status: 'Brouillon' | 'Envoyé' | 'Payé' | 'En retard' | 'Validé';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  fiscalRegime: string;
  createdAt: string;
  dueDate: string;
  notes: string;
  items: InvoiceItem[];
}

// ── Types Supabase (snake_case) ───────────────────────────────────────

interface InvoiceRow {
  id: string;
  user_id: string;
  number: string;
  type: string;
  title: string;
  subtitle: string;
  client_name: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  fiscal_regime: string;
  due_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

// ── Conversion helpers ────────────────────────────────────────────────

function toInvoice(row: InvoiceRow, itemRows: InvoiceItemRow[]): Invoice {
  return {
    id: row.id,
    number: row.number,
    type: row.type as Invoice['type'],
    title: row.title,
    subtitle: row.subtitle || '',
    clientName: row.client_name,
    status: row.status as Invoice['status'],
    subtotal: row.subtotal,
    taxRate: Number(row.tax_rate),
    taxAmount: row.tax_amount,
    total: row.total,
    fiscalRegime: row.fiscal_regime,
    createdAt: row.created_at,
    dueDate: row.due_date || '',
    notes: row.notes || '',
    items: itemRows
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ir => ({
        id: ir.id,
        description: ir.description,
        quantity: ir.quantity,
        unitPrice: ir.unit_price,
        total: ir.total,
      })),
  };
}

// ── Génération de numéro ──────────────────────────────────────────────

function generateNumber(type: 'devis' | 'facture', existingInvoices: Invoice[]): string {
  const prefix = type === 'devis' ? 'DEV' : 'FAC';
  const year = new Date().getFullYear();
  const count = existingInvoices.filter(i => i.type === type).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
}

// ── Hook ──────────────────────────────────────────────────────────────

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch ───────────────────────────────────────────────────────────

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Charger factures
    const { data: invoiceRows, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Erreur chargement factures:', invError);
      setLoading(false);
      return;
    }

    // Charger tous les items
    const invoiceIds = (invoiceRows || []).map(r => r.id);
    let itemRows: InvoiceItemRow[] = [];

    if (invoiceIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (itemsError) {
        console.error('Erreur chargement items:', itemsError);
      } else {
        itemRows = items || [];
      }
    }

    // Assembler
    const assembled = (invoiceRows || []).map(row =>
      toInvoice(row, itemRows.filter(ir => ir.invoice_id === row.id))
    );

    setInvoices(assembled);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ── Add ─────────────────────────────────────────────────────────────

  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt'>
  ): Promise<Invoice> => {
    if (!user) throw new Error('Non connecté');

    const number = invoiceData.number || generateNumber(invoiceData.type, invoices);

    // 1. Insérer la facture
    const { data: row, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        number,
        type: invoiceData.type,
        title: invoiceData.title,
        subtitle: invoiceData.subtitle || '',
        client_name: invoiceData.clientName,
        status: invoiceData.status,
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        total: invoiceData.total,
        fiscal_regime: invoiceData.fiscalRegime,
        due_date: invoiceData.dueDate || null,
        notes: invoiceData.notes || '',
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Insérer les items
    let insertedItems: InvoiceItemRow[] = [];
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item, index) => ({
        invoice_id: row.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        sort_order: index,
      }));

      const { data: itemRows, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Erreur insertion items:', itemsError);
      } else {
        insertedItems = itemRows || [];
      }
    }

    const newInvoice = toInvoice(row, insertedItems);
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  // ── Update ──────────────────────────────────────────────────────────

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    // Mettre à jour les champs de la facture
    const supabaseUpdates: Record<string, any> = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.subtitle !== undefined) supabaseUpdates.subtitle = updates.subtitle;
    if (updates.clientName !== undefined) supabaseUpdates.client_name = updates.clientName;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.subtotal !== undefined) supabaseUpdates.subtotal = updates.subtotal;
    if (updates.taxRate !== undefined) supabaseUpdates.tax_rate = updates.taxRate;
    if (updates.taxAmount !== undefined) supabaseUpdates.tax_amount = updates.taxAmount;
    if (updates.total !== undefined) supabaseUpdates.total = updates.total;
    if (updates.fiscalRegime !== undefined) supabaseUpdates.fiscal_regime = updates.fiscalRegime;
    if (updates.dueDate !== undefined) supabaseUpdates.due_date = updates.dueDate || null;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
    if (updates.number !== undefined) supabaseUpdates.number = updates.number;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;

    if (Object.keys(supabaseUpdates).length > 0) {
      const { error } = await supabase
        .from('invoices')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) {
        console.error('Erreur mise à jour facture:', error);
        return;
      }
    }

    // Si items fournis, remplacer tous les items
    if (updates.items !== undefined) {
      // Supprimer les anciens items
      const { error: delError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (delError) {
        console.error('Erreur suppression anciens items:', delError);
        return;
      }

      // Insérer les nouveaux
      if (updates.items.length > 0) {
        const itemsToInsert = updates.items.map((item, index) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          sort_order: index,
        }));

        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('Erreur insertion nouveaux items:', insertError);
          return;
        }
      }
    }

    // Mettre à jour l'état local
    setInvoices(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  // ── Delete ──────────────────────────────────────────────────────────

  const deleteInvoice = async (id: string) => {
    // Les items sont supprimés automatiquement (ON DELETE CASCADE)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression facture:', error);
      return;
    }

    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // ── Update status ───────────────────────────────────────────────────

  const updateStatus = async (id: string, status: Invoice['status']) => {
    await updateInvoice(id, { status });
  };

  // ── Transform devis → facture ───────────────────────────────────────

  const transformToInvoice = async (devisId: string): Promise<Invoice | null> => {
    const devis = invoices.find(i => i.id === devisId);
    if (!devis || devis.type !== 'devis' || devis.status !== 'Validé') {
      return null;
    }

    const newInvoice = await addInvoice({
      number: generateNumber('facture', invoices),
      type: 'facture',
      title: devis.title,
      subtitle: devis.subtitle,
      clientName: devis.clientName,
      status: 'Brouillon',
      subtotal: devis.subtotal,
      taxRate: devis.taxRate,
      taxAmount: devis.taxAmount,
      total: devis.total,
      fiscalRegime: devis.fiscalRegime,
      dueDate: '',
      notes: devis.notes,
      items: devis.items.map(item => ({
        id: '',
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });

    return newInvoice;
  };

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    transformToInvoice,
    updateStatus,
    refreshInvoices: fetchInvoices,
  };
};
