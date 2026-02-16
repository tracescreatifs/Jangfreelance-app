import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  type: string;
  status: 'En cours' | 'Terminé' | 'En pause' | 'Annulé';
  priority: 'Haute' | 'Moyenne' | 'Basse';
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  description: string;
  createdAt: string;
}

// Format Supabase (snake_case)
interface ProjectRow {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  name: string;
  type: string;
  status: string;
  priority: string;
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  description: string;
  created_at: string;
  updated_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id || '',
    clientName: row.client_name,
    type: row.type,
    status: row.status as Project['status'],
    priority: row.priority as Project['priority'],
    progress: row.progress,
    budget: row.budget,
    spent: row.spent,
    deadline: row.deadline,
    description: row.description,
    createdAt: row.created_at,
  };
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement projets:', error);
    } else {
      setProjects((data || []).map(toProject));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        client_id: projectData.clientId || null,
        client_name: projectData.clientName,
        name: projectData.name,
        type: projectData.type,
        status: projectData.status,
        priority: projectData.priority,
        progress: projectData.progress,
        budget: projectData.budget,
        spent: projectData.spent,
        deadline: projectData.deadline,
        description: projectData.description,
      })
      .select()
      .single();

    if (error) throw error;

    const newProject = toProject(data);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const supabaseUpdates: Record<string, any> = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.clientId !== undefined) supabaseUpdates.client_id = updates.clientId;
    if (updates.clientName !== undefined) supabaseUpdates.client_name = updates.clientName;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority;
    if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress;
    if (updates.budget !== undefined) supabaseUpdates.budget = updates.budget;
    if (updates.spent !== undefined) supabaseUpdates.spent = updates.spent;
    if (updates.deadline !== undefined) supabaseUpdates.deadline = updates.deadline;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;

    const { error } = await supabase
      .from('projects')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour projet:', error);
      return;
    }

    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression projet:', error);
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects,
  };
};
