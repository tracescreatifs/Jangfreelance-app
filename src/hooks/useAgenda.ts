import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// ── Types ────────────────────────────────────────────────────

export type AgendaEventType = 'task' | 'meeting' | 'appointment' | 'reminder';
export type AgendaEventStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type AgendaEventPriority = 'low' | 'medium' | 'high';

export interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  type: AgendaEventType;
  status: AgendaEventStatus;
  startDate: string | null;
  endDate: string | null;
  allDay: boolean;
  clientId: string | null;
  projectId: string | null;
  notes: string;
  priority: AgendaEventPriority;
  createdAt: string;
  updatedAt: string;
}

// Format Supabase (snake_case)
interface AgendaEventRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  all_day: boolean;
  client_id: string | null;
  project_id: string | null;
  notes: string;
  priority: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function toAgendaEvent(row: AgendaEventRow): AgendaEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    type: row.type as AgendaEventType,
    status: row.status as AgendaEventStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day,
    clientId: row.client_id,
    projectId: row.project_id,
    notes: row.notes || '',
    priority: row.priority as AgendaEventPriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Helper ───────────────────────────────────────────────────

export function getEventsForDate(events: AgendaEvent[], date: Date): AgendaEvent[] {
  const dayStr = date.toISOString().split('T')[0];
  return events.filter(e => {
    if (!e.startDate) return false;
    return e.startDate.split('T')[0] === dayStr;
  });
}

// ── Hook ─────────────────────────────────────────────────────

export const useAgenda = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .is('deleted_at', null)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Erreur chargement agenda:', error);
    } else {
      setEvents((data || []).map(toAgendaEvent));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendaEvent> => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('agenda_events')
      .insert({
        user_id: user.id,
        title: eventData.title,
        description: eventData.description || '',
        type: eventData.type,
        status: eventData.status,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        all_day: eventData.allDay,
        client_id: eventData.clientId || null,
        project_id: eventData.projectId || null,
        notes: eventData.notes || '',
        priority: eventData.priority,
      })
      .select()
      .single();

    if (error) throw error;

    const newEvent = toAgendaEvent(data);
    setEvents(prev => [newEvent, ...prev]);
    return newEvent;
  };

  const updateEvent = async (id: string, updates: Partial<AgendaEvent>) => {
    const supabaseUpdates: Record<string, any> = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate;
    if (updates.allDay !== undefined) supabaseUpdates.all_day = updates.allDay;
    if (updates.clientId !== undefined) supabaseUpdates.client_id = updates.clientId;
    if (updates.projectId !== undefined) supabaseUpdates.project_id = updates.projectId;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
    if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority;

    const { error } = await supabase
      .from('agenda_events')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour événement:', error);
      return;
    }

    setEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('agenda_events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression événement:', error);
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const toggleEventStatus = async (id: string, currentStatus: AgendaEventStatus) => {
    const newStatus: AgendaEventStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateEvent(id, { status: newStatus });
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventStatus,
    refreshEvents: fetchEvents,
  };
};
