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
  Crown
} from 'lucide-react';

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
    { name: 'Timer', icon: Clock, path: '/timer' },
    { name: 'Suivi de Projet', icon: BarChart3, path: '/suivi' },
    { name: 'Factures', icon: FileText, path: '/factures' },
    { name: 'Comptabilité', icon: Calculator, path: '/comptabilite' },
    { name: 'Exports', icon: Download, path: '/exports' },
    { name: 'Tarifs', icon: Crown, path: '/tarifs' },
    { name: 'Paramètres', icon: Settings, path: '/parametres' },
  ];

  return (
    <div className="w-64 h-screen glass-morphism p-6 fixed left-0 top-0 z-50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Jang</h1>
        <p className="text-purple-200 text-sm">{user?.email}</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="absolute bottom-6 left-6 right-6">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
