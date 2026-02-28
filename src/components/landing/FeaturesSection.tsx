import React from 'react';
import {
  Home,
  FolderOpen,
  Users,
  Briefcase,
  Clock,
  CalendarDays,
  BarChart3,
  FileText,
  Calculator,
  Download,
} from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const features = [
  {
    icon: Home,
    title: 'Dashboard',
    description: 'Vue d\'ensemble de votre activité avec chiffre d\'affaires, projets en cours et indicateurs clés.',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: FolderOpen,
    title: 'Gestion de Projets',
    description: 'Organisez vos projets, suivez l\'avancement et les deadlines de chaque mission.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Gestion des Clients',
    description: 'Centralisez vos contacts clients, historique des échanges et projets associés.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Briefcase,
    title: 'Catalogue de Services',
    description: 'Créez votre catalogue avec catégories, tarifs et descriptions détaillées.',
    gradient: 'from-teal-500 to-green-500',
  },
  {
    icon: Clock,
    title: 'Timer & Suivi du Temps',
    description: 'Chronométrez vos heures de travail par projet et calculez vos honoraires.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: CalendarDays,
    title: 'Agenda',
    description: 'Planifiez vos rendez-vous, tâches et deadlines dans un calendrier visuel.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'Suivi de Projet',
    description: 'Tableau de bord avancé avec métriques de progression et diagrammes visuels.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: FileText,
    title: 'Factures & Devis',
    description: 'Générez des factures et devis professionnels en PDF, conformes à la réglementation OHADA.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Calculator,
    title: 'Comptabilité',
    description: 'Suivi automatisé des revenus, dépenses et déclarations fiscales simplifiées.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Download,
    title: 'Exports',
    description: 'Exportez vos données en PDF, Excel et CSV pour votre comptable ou vos archives.',
    gradient: 'from-pink-500 to-purple-500',
  },
];

const FeaturesSection: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="fonctionnalites" className="relative py-20 sm:py-28">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">
            Fonctionnalités
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Une suite complète d'outils pour gérer votre activité freelance de A à Z.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={ref}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children ${isInView ? 'in-view' : ''}`}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group landing-glass rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
