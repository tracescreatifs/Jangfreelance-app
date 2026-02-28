
import React, { useState, useRef, useEffect } from 'react';
import { User, Building, Calculator, Palette, Shield, Bell, Globe, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfilPersonnel from '../components/parametres/ProfilPersonnel';
import ProfilProfessionnel from '../components/parametres/ProfilProfessionnel';
import ConfigurationFiscale from '../components/parametres/ConfigurationFiscale';
import Personnalisation from '../components/parametres/Personnalisation';
import Securite from '../components/parametres/Securite';
import Notifications from '../components/parametres/Notifications';
import Localisation from '../components/parametres/Localisation';
import PreferencesMetier from '../components/parametres/PreferencesMetier';
import { useUserProfile } from '../hooks/useUserProfile';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';

type ParametreSection =
  | 'profil-personnel'
  | 'profil-professionnel'
  | 'configuration-fiscale'
  | 'personnalisation'
  | 'securite'
  | 'notifications'
  | 'localisation'
  | 'preferences-metier';

const Parametres = () => {
  const [activeSection, setActiveSection] = useState<ParametreSection>('profil-personnel');
  const { profile: userProfile } = useUserProfile();
  const { profile: proProfile } = useProfessionalProfile();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSection]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = [userProfile?.prenom, userProfile?.nom].filter(Boolean).join(' ') || 'Utilisateur';
  const displayTitle = proProfile?.secteurActivite || 'Freelance';

  const sections = [
    { id: 'profil-personnel' as const, name: 'Profil', fullName: 'Profil Personnel', icon: User },
    { id: 'profil-professionnel' as const, name: 'Entreprise', fullName: 'Profil Professionnel', icon: Building },
    { id: 'configuration-fiscale' as const, name: 'Fiscal', fullName: 'Configuration Fiscale', icon: Calculator },
    { id: 'personnalisation' as const, name: 'Thème', fullName: 'Personnalisation', icon: Palette },
    { id: 'securite' as const, name: 'Sécurité', fullName: 'Sécurité & Licence', icon: Shield },
    { id: 'notifications' as const, name: 'Notifs', fullName: 'Notifications', icon: Bell },
    { id: 'localisation' as const, name: 'Langue', fullName: 'Localisation', icon: Globe },
    { id: 'preferences-metier' as const, name: 'Métier', fullName: 'Préférences Métier', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profil-personnel':
        return <ProfilPersonnel />;
      case 'profil-professionnel':
        return <ProfilProfessionnel />;
      case 'configuration-fiscale':
        return <ConfigurationFiscale />;
      case 'personnalisation':
        return <Personnalisation />;
      case 'securite':
        return <Securite />;
      case 'notifications':
        return <Notifications />;
      case 'localisation':
        return <Localisation />;
      case 'preferences-metier':
        return <PreferencesMetier />;
      default:
        return <ProfilPersonnel />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />

      <div className="lg:ml-64">
        {/* ── Mobile: Tabs horizontaux scrollables ──────────── */}
        <div className="lg:hidden pt-16 px-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Settings className="w-5 h-5 text-white/60" />
            <h1 className="text-lg font-bold text-white">Paramètres</h1>
          </div>
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-3 px-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  data-active={isActive}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg border border-white/20'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {section.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Desktop layout ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Desktop: Sidebar paramètres */}
          <div className="hidden lg:block w-80 min-h-screen fixed left-64 top-0 glass-morphism border-r border-white/20 p-6 z-30 overflow-y-auto">
            <div className="flex items-center space-x-3 mb-8">
              {userProfile?.photoUrl ? (
                <img
                  src={userProfile.photoUrl}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-white font-bold truncate">{displayName}</h2>
                <p className="text-purple-200 text-sm truncate">{displayTitle}</p>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
                <Settings className="w-6 h-6 mr-2 flex-shrink-0" />
                PARAMÈTRES
              </h1>
            </div>

            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeSection === section.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <section.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium truncate">{section.fullName}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 lg:ml-80 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
