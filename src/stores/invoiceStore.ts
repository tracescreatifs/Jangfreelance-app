
export interface Invoice {
  id: string;
  number: string;
  type: 'devis' | 'facture';
  title: string;
  subtitle?: string;
  clientName: string;
  status: 'Brouillon' | 'Envoyé' | 'Payé' | 'En retard' | 'Validé';
  total: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  fiscalRegime: string;
  createdAt: string;
  dueDate: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

const STORAGE_KEY = 'invoices';

class InvoiceStore {
  private invoices: Invoice[] = [
    {
      id: '1',
      number: 'DEV-2025-001',
      type: 'devis',
      title: 'Site Web Restaurant',
      subtitle: 'Développement complet',
      clientName: 'Restaurant Le Teranga',
      status: 'Validé',
      total: 500000,
      subtotal: 500000,
      taxRate: 0,
      taxAmount: 0,
      fiscalRegime: 'Régime Réel',
      createdAt: '2025-01-15',
      dueDate: '2025-02-15',
      items: [
        { id: '1', description: 'Conception UI/UX', quantity: 1, unitPrice: 200000, total: 200000 },
        { id: '2', description: 'Développement', quantity: 1, unitPrice: 300000, total: 300000 }
      ]
    },
    {
      id: '2',
      number: 'FAC-2025-001',
      type: 'facture',
      title: 'Logo Entreprise',
      subtitle: 'Création identité visuelle',
      clientName: 'Fashion Store SARL',
      status: 'Envoyé',
      total: 150000,
      subtotal: 150000,
      taxRate: 0,
      taxAmount: 0,
      fiscalRegime: 'Régime Réel',
      createdAt: '2025-01-10',
      dueDate: '2025-02-10',
      items: [
        { id: '3', description: 'Création logo', quantity: 1, unitPrice: 150000, total: 150000 }
      ]
    }
  ];

  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.invoices = JSON.parse(stored);
    }
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.invoices));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private generateNumber(type: 'devis' | 'facture'): string {
    const prefix = type === 'devis' ? 'DEV' : 'FAC';
    const year = new Date().getFullYear();
    const count = this.invoices.filter(i => i.type === type).length + 1;
    return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  }

  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  addInvoice(invoiceData: Omit<Invoice, 'id'>): Invoice {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      number: invoiceData.number || this.generateNumber(invoiceData.type),
      createdAt: invoiceData.createdAt || new Date().toISOString().split('T')[0]
    };

    this.invoices.push(newInvoice);
    this.saveToStorage();
    return newInvoice;
  }

  updateInvoice(id: string, updates: Partial<Invoice>) {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      this.invoices[index] = { ...this.invoices[index], ...updates };
      this.saveToStorage();
    }
  }

  deleteInvoice(id: string) {
    this.invoices = this.invoices.filter(i => i.id !== id);
    this.saveToStorage();
  }

  updateStatus(id: string, status: Invoice['status']) {
    this.updateInvoice(id, { status });
  }

  transformToInvoice(devisId: string): Invoice | null {
    const devis = this.invoices.find(i => i.id === devisId);
    if (!devis || devis.type !== 'devis' || devis.status !== 'Validé') {
      return null;
    }

    const newInvoice: Invoice = {
      ...devis,
      id: Date.now().toString(),
      number: this.generateNumber('facture'),
      type: 'facture',
      status: 'Brouillon',
      createdAt: new Date().toISOString().split('T')[0],
      items: devis.items.map((item, index) => ({
        ...item,
        id: item.id || `${Date.now()}-${index}`
      }))
    };

    this.invoices.push(newInvoice);
    this.saveToStorage();
    return newInvoice;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const invoiceStore = new InvoiceStore();
