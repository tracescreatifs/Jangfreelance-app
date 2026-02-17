import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Users,
  FolderOpen,
  BarChart3,
  FileText,
  Calculator,
  Download,
  Clock,
  Settings,
  LogOut,
  Crown,
  Briefcase,
  Menu,
  X,
  Shield,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const Sidebar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fermer le drawer quand on change de page
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Projets', icon: FolderOpen, path: '/projets' },
    { name: 'Clients', icon: Users, path: '/clients' },
    { name: 'Services', icon: Briefcase, path: '/services' },
    { name: 'Timer', icon: Clock, path: '/timer' },
    { name: 'Agenda', icon: CalendarDays, path: '/agenda' },
    { name: 'Suivi de Projet', icon: BarChart3, path: '/suivi' },
    { name: 'Factures', icon: FileText, path: '/factures' },
    { name: 'Comptabilité', icon: Calculator, path: '/comptabilite' },
    { name: 'Exports', icon: Download, path: '/exports' },
    { name: 'Corbeille', icon: Trash2, path: '/corbeille' },
    { name: 'Tarifs', icon: Crown, path: '/tarifs' },
    { name: 'Paramètres', icon: Settings, path: '/parametres' },
  ];

  const sidebarContent = (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white mb-1">Jang</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 font-mono bg-white/5 px-1.5 py-0.5 rounded">
              v{APP_VERSION}
            </span>
            {/* Bouton fermer visible uniquement sur mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-white/50 text-sm truncate">{user?.email}</p>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-lg'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Admin + Déconnexion */}
      <div className="pt-4 border-t border-white/10 space-y-1">
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 shadow-lg'
                  : 'text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-300'
              }`
            }
          >
            <Shield className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Admin</span>
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2.5 rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Bouton hamburger mobile — fixed en haut à gauche */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-morphism text-white hover:bg-white/10 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-screen w-64 glass-morphism p-6 z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </div>

      {/* Sidebar desktop — toujours visible */}
      <div className="hidden lg:flex w-64 h-screen glass-morphism p-6 fixed left-0 top-0 z-40 flex-col">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
