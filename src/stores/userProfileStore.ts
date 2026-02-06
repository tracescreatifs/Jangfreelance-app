
interface UserProfile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresseRue: string;
  adresseVille: string;
  adresseCodePostal: string;
  adressePays: string;
  bioDescription: string;
  specialites: string[];
  photoUrl?: string;
}

const STORAGE_KEY = 'user_profile';

class UserProfileStore {
  private profile: UserProfile = {
    prenom: 'Alex',
    nom: 'Dupont',
    email: 'alex.dupont@gmail.com',
    telephone: '+221 77 123 45 67',
    dateNaissance: '1990-03-15',
    adresseRue: 'Rue 123, Sicap Liberté',
    adresseVille: 'Dakar',
    adresseCodePostal: '12000',
    adressePays: 'Sénégal',
    bioDescription: 'Designer graphique spécialisé dans l\'identité visuelle pour PME africaines.',
    specialites: ['Logo & identité visuelle', 'Supports print et digital', 'Conseil en image de marque'],
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

  getProfile(): UserProfile {
    return { ...this.profile };
  }

  updateProfile(updates: Partial<UserProfile>) {
    this.profile = { ...this.profile, ...updates };
    this.saveToStorage();
  }

  addSpecialite(specialite: string) {
    if (!this.profile.specialites.includes(specialite.trim())) {
      this.profile.specialites.push(specialite.trim());
      this.saveToStorage();
    }
  }

  removeSpecialite(index: number) {
    this.profile.specialites.splice(index, 1);
    this.saveToStorage();
  }

  updatePhoto(photoUrl: string) {
    this.profile.photoUrl = photoUrl;
    this.saveToStorage();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const userProfileStore = new UserProfileStore();
