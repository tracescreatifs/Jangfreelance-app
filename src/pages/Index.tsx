
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationCard from '../components/NotificationCard';
import NotificationActions from '../components/NotificationActions';
import QuickAction from '../components/QuickAction';
import NewProjectModal from '../components/modals/NewProjectModal';
import NewClientModal from '../components/modals/NewClientModal';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';
import ProjectStatusChart from '../components/dashboard/ProjectStatusChart';
import TopClients from '../components/dashboard/TopClients';
import AlertsSection from '../components/dashboard/AlertsSection';

import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import { useTransactions } from '../hooks/useTransactions';

import { Plus, FileText, UserPlus, Calendar, BarChart3, DollarSign } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { invoices } = useInvoices();
  const { transactions } = useTransactions();

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'info' as const,
      message: 'Bienvenue sur votre tableau de bord Jang',
      clientName: '',
      projectName: '',
      timestamp: new Date(),
      isRead: false
    }
  ]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ── KPI calculés depuis Supabase ──────────────────────────────────

  const kpiData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Recettes du mois en cours (factures payées)
    const monthRevenue = invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return inv.type === 'facture' && inv.status === 'Payé' &&
          d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    // Recettes du mois précédent
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthRevenue = invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return inv.type === 'facture' && inv.status === 'Payé' &&
          d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const revenueGrowth = prevMonthRevenue > 0
      ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    const activeProjects = projects.filter(p => p.status === 'En cours').length;

    return {
      currentMonth: { revenue: monthRevenue, projects: activeProjects },
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalHours: 0,
      clientsCount: clients.length,
    };
  }, [invoices, projects, clients]);

  // ── Données graphique revenus (6 derniers mois) ───────────────────

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = targetMonth.getMonth();
      const y = targetMonth.getFullYear();

      const revenue = invoices
        .filter(inv => {
          const d = new Date(inv.createdAt);
          return inv.type === 'facture' && inv.status === 'Payé' &&
            d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      const expenses = transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === 'depense' && d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, t) => sum + t.montant, 0);

      const projectCount = projects.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;

      data.push({
        month: months[m],
        revenue,
        expenses,
        projects: projectCount,
      });
    }

    return data;
  }, [invoices, transactions, projects]);

  // ── Données statut projets ────────────────────────────────────────

  const projectStatusData = useMemo(() => {
    const enCours = projects.filter(p => p.status === 'En cours').length;
    const termines = projects.filter(p => p.status === 'Terminé').length;
    const enPause = projects.filter(p => p.status === 'En pause').length;

    return [
      { name: 'En cours', value: enCours, color: '#3B82F6' },
      { name: 'Terminés', value: termines, color: '#10B981' },
      { name: 'En pause', value: enPause, color: '#F59E0B' },
    ];
  }, [projects]);

  // ── Top clients ───────────────────────────────────────────────────

  const topClientsData = useMemo(() => {
    const clientMap = new Map<string, { name: string; projects: number; revenue: number }>();

    // Compter projets par client
    projects.forEach(p => {
      if (p.clientName) {
        const existing = clientMap.get(p.clientName) || { name: p.clientName, projects: 0, revenue: 0 };
        existing.projects++;
        clientMap.set(p.clientName, existing);
      }
    });

    // Ajouter revenus par client (factures payées)
    invoices
      .filter(inv => inv.type === 'facture' && inv.status === 'Payé')
      .forEach(inv => {
        const existing = clientMap.get(inv.clientName) || { name: inv.clientName, projects: 0, revenue: 0 };
        existing.revenue += inv.total;
        clientMap.set(inv.clientName, existing);
      });

    return Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(c => ({ ...c, satisfaction: 0 }));
  }, [projects, invoices]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-project':
        setIsProjectModalOpen(true);
        break;
      case 'new-client':
        setIsClientModalOpen(true);
        break;
      case 'new-invoice':
        setIsInvoiceModalOpen(true);
        break;
      case 'schedule':
        navigate('/agenda');
        break;
      case 'analytics':
        navigate('/suivi');
        break;
      case 'accounting':
        navigate('/comptabilite');
        break;
      default:
        break;
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-purple-200">Vue d'ensemble de votre activité freelance</p>
        </div>

        {/* KPI Cards */}
        <KPICards
          currentMonth={kpiData.currentMonth}
          revenueGrowth={kpiData.revenueGrowth}
          totalHours={kpiData.totalHours}
          clientsCount={kpiData.clientsCount}
          formatCurrency={formatCurrency}
        />

        {/* Actions rapides */}
        <div className="glass-morphism p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <QuickAction
              icon={Plus}
              title="Nouveau Projet"
              description="Créer un projet"
              onClick={() => handleQuickAction('new-project')}
            />
            <QuickAction
              icon={UserPlus}
              title="Nouveau Client"
              description="Ajouter un client"
              onClick={() => handleQuickAction('new-client')}
            />
            <QuickAction
              icon={FileText}
              title="Nouvelle Facture"
              description="Créer une facture"
              onClick={() => handleQuickAction('new-invoice')}
            />
            <QuickAction
              icon={Calendar}
              title="Planifier"
              description="Gérer le planning"
              onClick={() => handleQuickAction('schedule')}
            />
            <QuickAction
              icon={BarChart3}
              title="Analyser"
              description="Voir les stats"
              onClick={() => handleQuickAction('analytics')}
            />
            <QuickAction
              icon={DollarSign}
              title="Comptabilité"
              description="Gérer les finances"
              onClick={() => handleQuickAction('accounting')}
            />
          </div>
        </div>

        {/* Graphiques et données */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <RevenueChart data={revenueData} formatCurrency={formatCurrency} />
          <ProjectStatusChart data={projectStatusData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <TopClients clients={topClientsData} formatCurrency={formatCurrency} />
          <AlertsSection />
        </div>

        {/* Notifications */}
        <div className="glass-morphism p-4 sm:p-6 rounded-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Notifications Récentes</h2>
          <div className="space-y-3 sm:space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id}>
                  <NotificationCard
                    type={notification.type}
                    message={notification.message}
                    timestamp={notification.timestamp}
                    isRead={notification.isRead}
                  />
                  <NotificationActions
                    notificationId={notification.id}
                    clientName={notification.clientName}
                    projectName={notification.projectName}
                    onDismiss={() => dismissNotification(notification.id)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="text-purple-300 text-sm sm:text-base">Aucune notification récente</div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <NewProjectModal
          open={isProjectModalOpen}
          onOpenChange={setIsProjectModalOpen}
        />

        <NewClientModal
          open={isClientModalOpen}
          onOpenChange={setIsClientModalOpen}
        />

        <NewInvoiceModal
          open={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
        />
      </div>
    </div>
  );
};

export default Index;
