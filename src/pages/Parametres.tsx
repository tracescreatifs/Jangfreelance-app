
import React, { useState } from 'react';
import { User, Building, Calculator, Palette, Shield, Bell, Globe, Settings, Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfilPersonnel from '../components/parametres/ProfilPersonnel';
import ProfilProfessionnel from '../components/parametres/ProfilProfessionnel';
import ConfigurationFiscale from '../components/parametres/ConfigurationFiscale';
import Personnalisation from '../components/parametres/Personnalisation';
import Securite from '../components/parametres/Securite';
import Notifications from '../components/parametres/Notifications';
import Localisation from '../components/parametres/Localisation';
import PreferencesMetier from '../components/parametres/PreferencesMetier';
import { Button } from '../components/ui/button';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile: userProfile } = useUserProfile();
  const { profile: proProfile } = useProfessionalProfile();

  // Calculer les initiales du nom
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = userProfile?.nom || 'Utilisateur';
  const displayTitle = proProfile?.secteurActivite || 'Freelance';

  const sections = [
    { id: 'profil-personnel' as const, name: 'Profil Personnel', icon: User },
    { id: 'profil-professionnel' as const, name: 'Profil Professionnel', icon: Building },
    { id: 'configuration-fiscale' as const, name: 'Configuration Fiscale', icon: Calculator },
    { id: 'personnalisation' as const, name: 'Personnalisation', icon: Palette },
    { id: 'securite' as const, name: 'Sécurité & Licence', icon: Shield },
    { id: 'notifications' as const, name: 'Notifications', icon: Bell },
    { id: 'localisation' as const, name: 'Localisation', icon: Globe },
    { id: 'preferences-metier' as const, name: 'Préférences Métier', icon: Settings },
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
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="ml-0 lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden p-4">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="glass-morphism border-white/20 text-white"
            size="sm"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar des paramètres */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 lg:min-h-screen lg:fixed lg:left-64 lg:top-0 glass-morphism border-r border-white/20 p-6 z-30`}>
            <div className="flex items-center space-x-3 mb-8">
              {userProfile?.photo ? (
                <img
                  src={userProfile.photo}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(displayName)}
                </div>
              )}
              <div>
                <h2 className="text-white font-bold">{displayName}</h2>
                <p className="text-purple-200 text-sm">{displayTitle}</p>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                PARAMÈTRES
              </h1>
            </div>

            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeSection === section.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <section.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 lg:ml-80 p-6 lg:p-8">
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
