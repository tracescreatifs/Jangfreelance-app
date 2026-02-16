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
  private static readonly CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly PLAN_CODES: Record<string, string> = {
    STARTER: 'S',
    PRO: 'P',
    ENTERPRISE: 'E',
  };
  private static readonly PLAN_FROM_CODE: Record<string, 'STARTER' | 'PRO' | 'ENTERPRISE'> = {
    S: 'STARTER',
    P: 'PRO',
    E: 'ENTERPRISE',
  };
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

  // Génère N caractères aléatoires parmi 0-9A-Z
  private static randomChars(n: number): string {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
    }
    return result;
  }

  // Génère une clé de licence unique — format fixe : FL-XAAA-BBBB-CCCC-DDDD (22 chars)
  static generateLicenseKey(plan: keyof typeof LicenseGenerator.PLANS, durationMonths: number = 1, clientName?: string): LicenseInfo {
    const planChar = this.PLAN_CODES[plan]; // S, P ou E
    const block1 = planChar + this.randomChars(3);
    const block2 = this.randomChars(4);
    const block3 = this.randomChars(4);
    const block4 = this.randomChars(4);

    // Format: FL-P9A2-K4M7-R2P5-B8N3 (toujours 22 caractères)
    const key = `${this.PREFIX}-${block1}-${block2}-${block3}-${block4}`;

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

  // Valide une clé de licence (supporte ancien et nouveau format)
  static validateLicenseKey(key: string): LicenseInfo | null {
    try {
      // Vérification du préfixe
      if (!key.startsWith(this.PREFIX + '-')) {
        return null;
      }

      const parts = key.split('-');

      // ── Nouveau format : FL-XAAA-BBBB-CCCC-DDDD (5 parties) ──
      if (parts.length === 5) {
        const [prefix, block1, block2, block3, block4] = parts;
        if (prefix !== this.PREFIX) return null;
        if (block1.length !== 4 || block2.length !== 4 || block3.length !== 4 || block4.length !== 4) return null;

        // Premier caractère du bloc 1 = code plan
        const planChar = block1[0];
        const plan = this.PLAN_FROM_CODE[planChar];
        if (!plan) return null;

        const planInfo = this.PLANS[plan];

        return {
          key,
          isValid: true,
          plan,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          maxProjects: planInfo.maxProjects,
          maxUsers: planInfo.maxUsers,
          features: planInfo.features,
          generatedAt: new Date().toISOString()
        };
      }

      // ── Ancien format : FL-PRO-TIMESTAMP-RANDOM (4 parties) ──
      if (parts.length === 4) {
        const [prefix, planCode, timestampHex] = parts;
        if (prefix !== this.PREFIX) return null;

        let plan: keyof typeof LicenseGenerator.PLANS;
        if (planCode === 'STA') plan = 'STARTER';
        else if (planCode === 'PRO') plan = 'PRO';
        else if (planCode === 'ENT') plan = 'ENTERPRISE';
        else return null;

        const timestamp = parseInt(timestampHex, 36);
        const generatedAt = new Date(timestamp).toISOString();
        const expiryDate = new Date(timestamp);
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const planInfo = this.PLANS[plan];
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
      }

      return null;
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