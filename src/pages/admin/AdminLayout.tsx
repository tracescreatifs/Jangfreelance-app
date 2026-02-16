import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shield, Users, Key, DollarSign, Mail, LayoutDashboard, ArrowLeft, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Utilisateurs', icon: Users, path: '/admin/users' },
  { name: 'Licences', icon: Key, path: '/admin/licenses' },
  { name: 'Revenus', icon: DollarSign, path: '/admin/revenue' },
  { name: 'Emails', icon: Mail, path: '/admin/emails' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="glass-morphism border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Jang</h1>
          </div>

          <NavLink
            to="/"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour à l'app</span>
          </NavLink>
        </div>

        {/* Horizontal tab navigation */}
        <nav className="px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {navItems.map((item) => {
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-purple-400 text-white'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Page content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
