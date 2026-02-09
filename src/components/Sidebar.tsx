import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Briefcase
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
    { name: 'Suivi de Projet', icon: BarChart3, path: '/suivi' },
    { name: 'Factures', icon: FileText, path: '/factures' },
    { name: 'Comptabilité', icon: Calculator, path: '/comptabilite' },
    { name: 'Exports', icon: Download, path: '/exports' },
    { name: 'Tarifs', icon: Crown, path: '/tarifs' },
    { name: 'Paramètres', icon: Settings, path: '/parametres' },
  ];

  return (
    <div className="w-64 h-screen glass-morphism p-6 fixed left-0 top-0 z-50 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white mb-1">Jang</h1>
          <span className="text-[10px] text-white/30 font-mono bg-white/5 px-1.5 py-0.5 rounded">
            v{APP_VERSION}
          </span>
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

      {/* Déconnexion */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2.5 rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
