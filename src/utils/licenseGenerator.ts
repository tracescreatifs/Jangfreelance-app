export interface LicenseInfo {
  key: string;
  isValid: boolean;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  expiryDate: string;
  maxProjects: number;
  maxUsers: number;
  features: string[];
  generatedAt: string;
  clientName?: string;
}

// Générateur de clés de licence
export class LicenseGenerator {
  private static readonly PREFIX = 'FL'; // FreeLance
  private static readonly PLANS = {
    STARTER: {
      maxProjects: 5,
      maxUsers: 1,
      features: ['Dashboard basique', 'Gestion clients', 'Timer'],
      price: 15000 // XOF par mois
    },
    PRO: {
      maxProjects: 50,
      maxUsers: 3,
      features: ['Dashboard avancé', 'Gestion clients', 'Timer', 'Factures', 'Exports', 'Support prioritaire'],
      price: 35000 // XOF par mois
    },
    ENTERPRISE: {
      maxProjects: -1, // illimité
      maxUsers: 10,
      features: ['Toutes les fonctionnalités', 'White-label', 'API personnalisée', 'Support dédié'],
      price: 75000 // XOF par mois
    }
  };

  // Génère une clé de licence unique
  static generateLicenseKey(plan: keyof typeof LicenseGenerator.PLANS, durationMonths: number = 1, clientName?: string): LicenseInfo {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const planCode = plan.substring(0, 3).toUpperCase();
    
    // Format: FL-PRO-TIMESTAMP-RANDOM
    const key = `${this.PREFIX}-${planCode}-${timestamp.toString(36).toUpperCase()}-${random.toUpperCase()}`;
    
    const generatedAt = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    
    const planInfo = this.PLANS[plan];
    
    return {
      key,
      isValid: true,
      plan,
      expiryDate: expiryDate.toISOString(),
      maxProjects: planInfo.maxProjects,
      maxUsers: planInfo.maxUsers,
      features: planInfo.features,
      generatedAt,
      clientName
    };
  }

  // Valide une clé de licence
  static validateLicenseKey(key: string): LicenseInfo | null {
    try {
      // Vérification du format
      if (!key.startsWith(this.PREFIX + '-')) {
        return null;
      }

      const parts = key.split('-');
      if (parts.length !== 4) {
        return null;
      }

      const [prefix, planCode, timestampHex, random] = parts;
      
      // Vérification du préfixe
      if (prefix !== this.PREFIX) {
        return null;
      }

      // Détermination du plan
      let plan: keyof typeof LicenseGenerator.PLANS;
      if (planCode === 'STA') plan = 'STARTER';
      else if (planCode === 'PRO') plan = 'PRO';
      else if (planCode === 'ENT') plan = 'ENTERPRISE';
      else return null;

      // Reconstruction des informations
      const timestamp = parseInt(timestampHex, 36);
      const generatedAt = new Date(timestamp).toISOString();
      
      // Pour la validation, on assume 1 mois de validité par défaut
      const expiryDate = new Date(timestamp);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      const planInfo = this.PLANS[plan];
      
      // Vérification de l'expiration
      const isValid = expiryDate > new Date();
      
      return {
        key,
        isValid,
        plan,
        expiryDate: expiryDate.toISOString(),
        maxProjects: planInfo.maxProjects,
        maxUsers: planInfo.maxUsers,
        features: planInfo.features,
        generatedAt
      };
    } catch (error) {
      return null;
    }
  }

  // Génère plusieurs licences pour la vente
  static generateBulkLicenses(plan: keyof typeof LicenseGenerator.PLANS, count: number, durationMonths: number = 1): LicenseInfo[] {
    const licenses: LicenseInfo[] = [];
    
    for (let i = 0; i < count; i++) {
      licenses.push(this.generateLicenseKey(plan, durationMonths));
    }
    
    return licenses;
  }

  // Obtient les informations d'un plan
  static getPlanInfo(plan: keyof typeof LicenseGenerator.PLANS) {
    return this.PLANS[plan];
  }

  // Obtient tous les plans disponibles
  static getAllPlans() {
    return this.PLANS;
  }
}