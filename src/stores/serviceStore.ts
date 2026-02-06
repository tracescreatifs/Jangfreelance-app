
interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SubCategory {
  id: string;
  name: string;
  services: Service[];
}

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

class ServiceStore {
  private storageKey = 'freelance-services';

  getCategories(): Category[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultCategories();
    } catch {
      return this.getDefaultCategories();
    }
  }

  private getDefaultCategories(): Category[] {
    return [
      {
        id: 'design',
        name: 'Design Graphique',
        subCategories: [
          {
            id: 'identity',
            name: 'Identité Visuelle',
            services: [
              { id: 'logo-simple', name: 'Logo Simple', price: 75000, description: 'Logo avec 2 concepts et 2 révisions' },
              { id: 'logo-premium', name: 'Logo Premium', price: 150000, description: 'Logo avec guide d\'utilisation complet' },
              { id: 'charte-graphique', name: 'Charte Graphique', price: 200000, description: 'Identité complète avec guide' }
            ]
          },
          {
            id: 'print',
            name: 'Print & Communication',
            services: [
              { id: 'carte-visite', name: 'Carte de Visite', price: 25000, description: 'Recto-verso avec 3 concepts' },
              { id: 'flyer', name: 'Flyer A5', price: 35000, description: 'Design recto-verso optimisé' },
              { id: 'affiche', name: 'Affiche A3', price: 50000, description: 'Design professionnel haute résolution' },
              { id: 'brochure', name: 'Brochure 8 pages', price: 125000, description: 'Mise en page complète avec images' }
            ]
          }
        ]
      },
      {
        id: 'web',
        name: 'Développement Web',
        subCategories: [
          {
            id: 'sites',
            name: 'Sites Internet',
            services: [
              { id: 'site-vitrine', name: 'Site Vitrine', price: 300000, description: '5 pages responsive avec CMS' },
              { id: 'site-ecommerce', name: 'Site E-commerce', price: 750000, description: 'Boutique complète avec paiement' },
              { id: 'landing-page', name: 'Landing Page', price: 150000, description: 'Page de vente optimisée' }
            ]
          },
          {
            id: 'apps',
            name: 'Applications',
            services: [
              { id: 'app-mobile', name: 'App Mobile Simple', price: 500000, description: 'Application iOS/Android basique' },
              { id: 'app-complexe', name: 'App Mobile Avancée', price: 1200000, description: 'App avec backend et fonctionnalités avancées' }
            ]
          }
        ]
      },
      {
        id: 'marketing',
        name: 'Marketing Digital',
        subCategories: [
          {
            id: 'social',
            name: 'Réseaux Sociaux',
            services: [
              { id: 'post-social', name: 'Post Réseaux Sociaux', price: 15000, description: 'Design pour Instagram/Facebook' },
              { id: 'story-template', name: 'Template Stories', price: 25000, description: 'Pack de 10 templates' },
              { id: 'campagne-social', name: 'Campagne Sociale', price: 100000, description: 'Stratégie et visuels pour 1 mois' }
            ]
          }
        ]
      }
    ];
  }

  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save services:', error);
    }
  }

  addCustomService(categoryId: string, subCategoryId: string, service: Omit<Service, 'id'>): void {
    const categories = this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const subCategory = category.subCategories.find(sc => sc.id === subCategoryId);
      if (subCategory) {
        const newService: Service = {
          ...service,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        subCategory.services.push(newService);
        this.saveCategories(categories);
      }
    }
  }

  getAllServices(): Service[] {
    const categories = this.getCategories();
    const allServices: Service[] = [];
    
    categories.forEach(category => {
      category.subCategories.forEach(subCategory => {
        allServices.push(...subCategory.services);
      });
    });
    
    return allServices;
  }
}

export const serviceStore = new ServiceStore();
export type { Service, SubCategory, Category };
