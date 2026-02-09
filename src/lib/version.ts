// Version de l'application Jang
// Format: MAJOR.MINOR.PATCH
// - MAJOR: changements majeurs non rétrocompatibles
// - MINOR: nouvelles fonctionnalités rétrocompatibles
// - PATCH: corrections de bugs
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Jang';
export const APP_BUILD_DATE = '2025-02-09';

export const CHANGELOG: { version: string; date: string; changes: string[] }[] = [
  {
    version: '1.0.0',
    date: '2025-02-09',
    changes: [
      'Gestion complète des projets, clients et factures',
      'Catalogue de services personnalisable (catégories, sous-catégories, tarifs)',
      'Configuration fiscale multi-pays (Afrique de l\'Ouest)',
      'Système de paiement mobile money (PayDunya)',
      'Gestion des abonnements et licences',
      'Timer et suivi du temps',
      'Export PDF et Excel',
      'Paramètres complets : profil, fiscal, localisation, notifications, personnalisation',
      'Mode sombre et clair avec effet liquid glass',
      'Application PWA (installable)',
    ],
  },
];
