
interface Project {
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

class ProjectStore {
  private storageKey = 'freelance-projects';
  private listeners: (() => void)[] = [];

  getProjects(): Project[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultProjects();
    } catch {
      return this.getDefaultProjects();
    }
  }

  private getDefaultProjects(): Project[] {
    return [
      {
        id: '1',
        name: 'Logo Restaurant Le Teranga',
        clientId: '1',
        clientName: 'Restaurant Le Teranga',
        type: 'Logo & Identité',
        status: 'En cours',
        priority: 'Haute',
        progress: 75,
        budget: 200000,
        spent: 150000,
        deadline: '2025-07-15',
        description: 'Création d\'un logo moderne pour restaurant traditionnel sénégalais',
        createdAt: '2025-06-01'
      },
      {
        id: '2',
        name: 'Site E-commerce Fashion',
        clientId: '2',
        clientName: 'Fashion Store SARL',
        type: 'E-commerce',
        status: 'En cours',
        priority: 'Moyenne',
        progress: 40,
        budget: 800000,
        spent: 320000,
        deadline: '2025-08-30',
        description: 'Développement d\'une boutique en ligne complète',
        createdAt: '2025-06-10'
      },
      {
        id: '3',
        name: 'Identité Visuelle Startup',
        clientId: '3',
        clientName: 'TechStartup SN',
        type: 'Logo & Identité',
        status: 'Terminé',
        priority: 'Haute',
        progress: 100,
        budget: 150000,
        spent: 145000,
        deadline: '2025-06-20',
        description: 'Création complète de l\'identité visuelle',
        createdAt: '2025-05-15'
      }
    ];
  }

  addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...projectData,
      id: this.generateId(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    const projects = this.getProjects();
    projects.push(newProject);
    this.saveProjects(projects);
    this.notifyListeners();
    
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      this.saveProjects(projects);
      this.notifyListeners();
    }
  }

  deleteProject(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id);
    this.saveProjects(projects);
    this.notifyListeners();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const projectStore = new ProjectStore();
export type { Project };
