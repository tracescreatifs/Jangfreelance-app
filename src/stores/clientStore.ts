
interface Client {
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

class ClientStore {
  private storageKey = 'freelance-clients';
  private listeners: (() => void)[] = [];

  getClients(): Client[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultClients();
    } catch {
      return this.getDefaultClients();
    }
  }

  private getDefaultClients(): Client[] {
    return [
      {
        id: '1',
        name: 'Amadou Diallo',
        email: 'amadou.diallo@teranga.sn',
        phone: '+221 70 123 45 67',
        company: 'Restaurant Le Teranga',
        type: 'Entreprise',
        address: 'Rue de la Paix, Plateau',
        city: 'Dakar',
        projects: 3,
        totalRevenue: 450000,
        lastContact: '2025-06-25',
        status: 'Actif',
        notes: 'Client fidèle, projets récurrents',
        createdAt: '2025-05-01'
      },
      {
        id: '2',
        name: 'Fatou Sow',
        email: 'fatou@fashionstore.com',
        phone: '+221 77 987 65 43',
        company: 'Fashion Store SARL',
        type: 'Entreprise',
        address: 'Avenue Bourguiba, Mermoz',
        city: 'Dakar',
        projects: 1,
        totalRevenue: 800000,
        lastContact: '2025-06-28',
        status: 'Actif',
        notes: 'Nouveau client, gros projet e-commerce',
        createdAt: '2025-06-01'
      },
      {
        id: '3',
        name: 'Ousmane Kane',
        email: 'ousmane.kane@gmail.com',
        phone: '+221 76 456 78 90',
        company: 'Indépendant',
        type: 'Particulier',
        address: 'Sicap Liberté 6',
        city: 'Dakar',
        projects: 2,
        totalRevenue: 125000,
        lastContact: '2025-06-20',
        status: 'Actif',
        notes: 'Créateur de contenu, projets logo',
        createdAt: '2025-05-15'
      }
    ];
  }

  addClient(clientData: Omit<Client, 'id' | 'projects' | 'totalRevenue' | 'lastContact' | 'createdAt'>): Client {
    const newClient: Client = {
      ...clientData,
      id: this.generateId(),
      projects: 0,
      totalRevenue: 0,
      lastContact: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0]
    };

    const clients = this.getClients();
    clients.push(newClient);
    this.saveClients(clients);
    this.notifyListeners();
    
    return newClient;
  }

  updateClient(id: string, updates: Partial<Client>): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      this.saveClients(clients);
      this.notifyListeners();
    }
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter(c => c.id !== id);
    this.saveClients(clients);
    this.notifyListeners();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private saveClients(clients: Client[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(clients));
    } catch (error) {
      console.error('Failed to save clients:', error);
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

export const clientStore = new ClientStore();
export type { Client };
