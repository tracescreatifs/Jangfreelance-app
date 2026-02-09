import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  duration?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  services: Service[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  subCategories: SubCategory[];
}

const defaultCategories: Category[] = [
  {
    id: 'design',
    name: 'Design Graphique',
    icon: 'palette',
    subCategories: [
      {
        id: 'identity',
        name: 'Identité Visuelle',
        services: [
          { id: 'logo-simple', name: 'Logo Simple', price: 75000, description: 'Logo avec 2 concepts et 2 révisions', duration: '3-5 jours' },
          { id: 'logo-premium', name: 'Logo Premium', price: 150000, description: "Logo avec guide d'utilisation complet", duration: '7-10 jours' },
          { id: 'charte-graphique', name: 'Charte Graphique', price: 200000, description: 'Identité complète avec guide', duration: '10-15 jours' },
        ],
      },
      {
        id: 'print',
        name: 'Print & Communication',
        services: [
          { id: 'carte-visite', name: 'Carte de Visite', price: 25000, description: 'Recto-verso avec 3 concepts', duration: '2-3 jours' },
          { id: 'flyer', name: 'Flyer A5', price: 35000, description: 'Design recto-verso optimisé', duration: '2-3 jours' },
          { id: 'affiche', name: 'Affiche A3', price: 50000, description: 'Design professionnel haute résolution', duration: '3-5 jours' },
          { id: 'brochure', name: 'Brochure 8 pages', price: 125000, description: 'Mise en page complète avec images', duration: '7-10 jours' },
        ],
      },
    ],
  },
  {
    id: 'web',
    name: 'Développement Web',
    icon: 'code',
    subCategories: [
      {
        id: 'sites',
        name: 'Sites Internet',
        services: [
          { id: 'site-vitrine', name: 'Site Vitrine', price: 300000, description: '5 pages responsive avec CMS', duration: '15-20 jours' },
          { id: 'site-ecommerce', name: 'Site E-commerce', price: 750000, description: 'Boutique complète avec paiement', duration: '30-45 jours' },
          { id: 'landing-page', name: 'Landing Page', price: 150000, description: 'Page de vente optimisée', duration: '5-7 jours' },
        ],
      },
      {
        id: 'apps',
        name: 'Applications',
        services: [
          { id: 'app-mobile', name: 'App Mobile Simple', price: 500000, description: 'Application iOS/Android basique', duration: '30-45 jours' },
          { id: 'app-complexe', name: 'App Mobile Avancée', price: 1200000, description: 'App avec backend et fonctionnalités avancées', duration: '60-90 jours' },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Digital',
    icon: 'megaphone',
    subCategories: [
      {
        id: 'social',
        name: 'Réseaux Sociaux',
        services: [
          { id: 'post-social', name: 'Post Réseaux Sociaux', price: 15000, description: 'Design pour Instagram/Facebook', duration: '1 jour' },
          { id: 'story-template', name: 'Template Stories', price: 25000, description: 'Pack de 10 templates', duration: '2-3 jours' },
          { id: 'campagne-social', name: 'Campagne Sociale', price: 100000, description: 'Stratégie et visuels pour 1 mois', duration: '7 jours' },
        ],
      },
    ],
  },
];

const STORAGE_KEY = 'jang-services';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useServices = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        setCategories(defaultCategories);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
      }
    } catch {
      setCategories(defaultCategories);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const saveCategories = (updated: Category[]) => {
    setCategories(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // === CATEGORIES ===
  const addCategory = (name: string, icon?: string) => {
    const updated = [...categories, { id: generateId(), name, icon: icon || 'folder', subCategories: [] }];
    saveCategories(updated);
  };

  const updateCategory = (categoryId: string, name: string) => {
    const updated = categories.map(c => c.id === categoryId ? { ...c, name } : c);
    saveCategories(updated);
  };

  const deleteCategory = (categoryId: string) => {
    const updated = categories.filter(c => c.id !== categoryId);
    saveCategories(updated);
  };

  // === SUB-CATEGORIES ===
  const addSubCategory = (categoryId: string, name: string) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, subCategories: [...c.subCategories, { id: generateId(), name, services: [] }] };
      }
      return c;
    });
    saveCategories(updated);
  };

  const updateSubCategory = (categoryId: string, subCategoryId: string, name: string) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subCategories: c.subCategories.map(sc => sc.id === subCategoryId ? { ...sc, name } : sc),
        };
      }
      return c;
    });
    saveCategories(updated);
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, subCategories: c.subCategories.filter(sc => sc.id !== subCategoryId) };
      }
      return c;
    });
    saveCategories(updated);
  };

  // === SERVICES ===
  const addService = (categoryId: string, subCategoryId: string, service: Omit<Service, 'id'>) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subCategories: c.subCategories.map(sc => {
            if (sc.id === subCategoryId) {
              return { ...sc, services: [...sc.services, { ...service, id: generateId() }] };
            }
            return sc;
          }),
        };
      }
      return c;
    });
    saveCategories(updated);
  };

  const updateService = (categoryId: string, subCategoryId: string, serviceId: string, updates: Partial<Service>) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subCategories: c.subCategories.map(sc => {
            if (sc.id === subCategoryId) {
              return {
                ...sc,
                services: sc.services.map(s => s.id === serviceId ? { ...s, ...updates } : s),
              };
            }
            return sc;
          }),
        };
      }
      return c;
    });
    saveCategories(updated);
  };

  const deleteService = (categoryId: string, subCategoryId: string, serviceId: string) => {
    const updated = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subCategories: c.subCategories.map(sc => {
            if (sc.id === subCategoryId) {
              return { ...sc, services: sc.services.filter(s => s.id !== serviceId) };
            }
            return sc;
          }),
        };
      }
      return c;
    });
    saveCategories(updated);
  };

  // === STATS ===
  const getTotalServices = () => {
    return categories.reduce((total, c) => total + c.subCategories.reduce((t, sc) => t + sc.services.length, 0), 0);
  };

  const getTotalCategories = () => categories.length;

  const getAllServices = (): Service[] => {
    const all: Service[] = [];
    categories.forEach(c => c.subCategories.forEach(sc => all.push(...sc.services)));
    return all;
  };

  const resetToDefaults = () => {
    saveCategories(defaultCategories);
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addService,
    updateService,
    deleteService,
    getTotalServices,
    getTotalCategories,
    getAllServices,
    resetToDefaults,
  };
};
