import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: 'Particulier' | 'Entreprise';
  address: string;
  city: string;
  projects: number;
  total_revenue: number;
  last_contact: string;
  status: 'Actif' | 'Inactif' | 'Prospect';
  notes: string;
  created_at: string;
  updated_at: string;
}

// Alias pour compatibilité avec le code existant
export interface ClientLegacy {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type: 'Particulier' | 'Entreprise';
  address: string;
  city: string;
  projects: number;
  totalRevenue: number;
  lastContact: string;
  status: 'Actif' | 'Inactif' | 'Prospect';
  notes: string;
  createdAt: string;
}

// Convertir le format Supabase vers le format utilisé dans les composants
function toClientLegacy(client: Client): ClientLegacy {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    type: client.type,
    address: client.address,
    city: client.city,
    projects: client.projects,
    totalRevenue: client.total_revenue,
    lastContact: client.last_contact,
    status: client.status,
    notes: client.notes,
    createdAt: client.created_at,
  };
}

export const useClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientLegacy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement clients:', error);
    } else {
      setClients((data || []).map(toClientLegacy));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    type: 'Particulier' | 'Entreprise';
    address: string;
    city: string;
    status: 'Actif' | 'Inactif' | 'Prospect';
    notes: string;
  }): Promise<ClientLegacy> => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        type: clientData.type,
        address: clientData.address,
        city: clientData.city,
        status: clientData.status,
        notes: clientData.notes,
        projects: 0,
        total_revenue: 0,
        last_contact: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    const newClient = toClientLegacy(data);
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<ClientLegacy>) => {
    // Convertir les noms de champs du format legacy vers Supabase
    const supabaseUpdates: Record<string, any> = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.email !== undefined) supabaseUpdates.email = updates.email;
    if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
    if (updates.company !== undefined) supabaseUpdates.company = updates.company;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.address !== undefined) supabaseUpdates.address = updates.address;
    if (updates.city !== undefined) supabaseUpdates.city = updates.city;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
    if (updates.projects !== undefined) supabaseUpdates.projects = updates.projects;
    if (updates.totalRevenue !== undefined) supabaseUpdates.total_revenue = updates.totalRevenue;
    if (updates.lastContact !== undefined) supabaseUpdates.last_contact = updates.lastContact;

    const { error } = await supabase
      .from('clients')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour client:', error);
      return;
    }

    // Mettre à jour l'état local
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression client:', error);
      return;
    }

    setClients(prev => prev.filter(c => c.id !== id));
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refreshClients: fetchClients,
  };
};
