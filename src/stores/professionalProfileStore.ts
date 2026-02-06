
interface ProfessionalProfile {
  nomCommercial: string;
  formeJuridique: string;
  secteurActivite: string;
  dateCreation: string;
  nombreEmployes: string;
  adresseRue: string;
  adresseVille: string;
  adresseRegion: string;
  adresseCodePostal: string;
  adressePays: string;
  emailProfessionnel: string;
  telephoneBureau: string;
  siteWeb: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  logoUrl?: string;
}

const STORAGE_KEY = 'professional_profile';

class ProfessionalProfileStore {
  private profile: ProfessionalProfile = {
    nomCommercial: 'FreelanceHub Studio',
    formeJuridique: 'Entreprise personnelle',
    secteurActivite: 'Communication & Design',
    dateCreation: '2020-01',
    nombreEmployes: 'Seul',
    adresseRue: 'Immeuble Fahd, Plateau',
    adresseVille: 'Dakar',
    adresseRegion: 'Dakar',
    adresseCodePostal: '12000',
    adressePays: 'Sénégal',
    emailProfessionnel: 'contact@freelancehub-studio.sn',
    telephoneBureau: '+221 33 123 45 67',
    siteWeb: 'www.freelancehub-studio.sn',
    instagram: '@freelancehub_studio',
    linkedin: 'alex-dupont-designer',
    facebook: 'FreelanceHub Studio',
  };

  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.profile = { ...this.profile, ...JSON.parse(stored) };
    }
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getProfile(): ProfessionalProfile {
    return { ...this.profile };
  }

  updateProfile(updates: Partial<ProfessionalProfile>) {
    this.profile = { ...this.profile, ...updates };
    this.saveToStorage();
  }

  updateLogo(logoUrl: string) {
    this.profile.logoUrl = logoUrl;
    this.saveToStorage();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const professionalProfileStore = new ProfessionalProfileStore();
