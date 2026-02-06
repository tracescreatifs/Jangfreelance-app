
interface Receipt {
  id: string;
  date: string;
  amount: number;
  category: string;
  vendor: string;
  description: string;
  imageUrl?: string;
  extractedData?: {
    vendor?: string;
    amount?: number;
    date?: string;
  };
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  category: string;
  nextDue: string;
  active: boolean;
}

interface BudgetAlert {
  id: string;
  category: string;
  budgetLimit: number;
  currentSpent: number;
  alertThreshold: number; // pourcentage
}

const RECEIPTS_KEY = 'accounting_receipts';
const RECURRING_KEY = 'recurring_expenses';
const BUDGETS_KEY = 'budget_alerts';

class AccountingStore {
  private receipts: Receipt[] = [];
  private recurringExpenses: RecurringExpense[] = [];
  private budgetAlerts: BudgetAlert[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const receiptsData = localStorage.getItem(RECEIPTS_KEY);
    const recurringData = localStorage.getItem(RECURRING_KEY);
    const budgetsData = localStorage.getItem(BUDGETS_KEY);

    if (receiptsData) this.receipts = JSON.parse(receiptsData);
    if (recurringData) this.recurringExpenses = JSON.parse(recurringData);
    if (budgetsData) this.budgetAlerts = JSON.parse(budgetsData);
  }

  private saveToStorage() {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(this.receipts));
    localStorage.setItem(RECURRING_KEY, JSON.stringify(this.recurringExpenses));
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(this.budgetAlerts));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Gestion des reçus
  addReceipt(receipt: Omit<Receipt, 'id'>) {
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString()
    };
    this.receipts.push(newReceipt);
    this.saveToStorage();
  }

  getReceipts() {
    return [...this.receipts];
  }

  // OCR simulation pour extraction de données
  extractReceiptData(imageFile: File): Promise<any> {
    return new Promise((resolve) => {
      // Simulation OCR - en production, utiliser un service comme Google Vision API
      setTimeout(() => {
        resolve({
          vendor: 'Fournisseur détecté',
          amount: Math.floor(Math.random() * 50000) + 5000,
          date: new Date().toISOString().split('T')[0]
        });
      }, 2000);
    });
  }

  // Gestion des abonnements récurrents
  addRecurringExpense(expense: Omit<RecurringExpense, 'id'>) {
    const newExpense: RecurringExpense = {
      ...expense,
      id: Date.now().toString()
    };
    this.recurringExpenses.push(newExpense);
    this.saveToStorage();
  }

  getRecurringExpenses() {
    return [...this.recurringExpenses];
  }

  // Calcul BRS automatique
  calculateBRS(revenue: number, country: 'CI' | 'SN' = 'SN') {
    const rate = 0.05; // 5% pour BRS
    const brsAmount = revenue * rate;
    
    // Seuils TVA par pays
    const tvaThresholds = {
      'CI': 75000000, // 75M FCFA
      'SN': 50000000  // 50M FCFA
    };

    const threshold = tvaThresholds[country];
    const shouldSwitchToTVA = revenue > threshold;

    return {
      brsAmount,
      rate: rate * 100,
      shouldSwitchToTVA,
      threshold,
      country
    };
  }

  // Gestion des alertes budget
  setBudgetAlert(category: string, limit: number, threshold: number = 80) {
    const existingIndex = this.budgetAlerts.findIndex(alert => alert.category === category);
    const alert: BudgetAlert = {
      id: existingIndex >= 0 ? this.budgetAlerts[existingIndex].id : Date.now().toString(),
      category,
      budgetLimit: limit,
      currentSpent: existingIndex >= 0 ? this.budgetAlerts[existingIndex].currentSpent : 0,
      alertThreshold: threshold
    };

    if (existingIndex >= 0) {
      this.budgetAlerts[existingIndex] = alert;
    } else {
      this.budgetAlerts.push(alert);
    }
    
    this.saveToStorage();
  }

  getBudgetAlerts() {
    return [...this.budgetAlerts];
  }

  // Export FEC/CSV
  exportToCSV(data: any[], filename: string) {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const accountingStore = new AccountingStore();
