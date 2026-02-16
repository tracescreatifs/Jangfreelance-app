
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';
import ProjectStatusChart from '../components/dashboard/ProjectStatusChart';
import TimeTrackingChart from '../components/dashboard/TimeTrackingChart';
import TopClients from '../components/dashboard/TopClients';
import AlertsSection from '../components/dashboard/AlertsSection';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import { useTransactions } from '../hooks/useTransactions';

const Suivi = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { clients } = useClients();
  const { projects } = useProjects();
  const { invoices } = useInvoices();
  const { transactions } = useTransactions();

  // Sessions de timer depuis localStorage
  const [timerSessions, setTimerSessions] = useState<any[]>([]);

  useEffect(() => {
    const savedSessions = localStorage.getItem('timer-sessions');
    if (savedSessions) {
      setTimerSessions(JSON.parse(savedSessions));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculer les données du graphique de revenus (6 derniers mois)
  const revenueData = useMemo(() => {
    const now = new Date();
    const months = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Revenus des factures payées ce mois
      const monthRevenue = invoices
        .filter(inv => inv.type === 'facture' && inv.status === 'Payé' && inv.createdAt.startsWith(monthKey))
        .reduce((sum, inv) => sum + inv.total, 0);

      // Dépenses ce mois
      const monthExpenses = transactions
        .filter(t => t.type === 'depense' && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.montant, 0);

      // Nombre de projets créés ce mois
      const monthProjects = projects
        .filter(p => p.createdAt && p.createdAt.startsWith(monthKey))
        .length;

      months.push({
        month: monthNames[date.getMonth()],
        revenue: monthRevenue,
        expenses: monthExpenses,
        projects: monthProjects
      });
    }

    return months;
  }, [invoices, transactions, projects]);

  // Calculer les statuts des projets
  const projectStatusData = useMemo(() => {
    const enCours = projects.filter(p => p.status === 'En cours').length;
    const termines = projects.filter(p => p.status === 'Terminé').length;
    const enPause = projects.filter(p => p.status === 'En pause').length;
    const annules = projects.filter(p => p.status === 'Annulé').length;

    return [
      { name: 'Terminés', value: termines, color: '#10B981' },
      { name: 'En cours', value: enCours, color: '#3B82F6' },
      { name: 'En pause', value: enPause, color: '#F59E0B' },
      { name: 'Annulés', value: annules, color: '#EF4444' }
    ];
  }, [projects]);

  // Calculer les top clients
  const extractName = (fullClientName: string) =>
    fullClientName.split(' - ')[0].toLowerCase().trim();

  const clientsData = useMemo(() => {
    return clients
      .map(client => {
        const clientNameLower = client.name.toLowerCase().trim();
        const clientProjects = projects.filter(p =>
          extractName(p.clientName) === clientNameLower
        ).length;
        const clientRevenue = invoices
          .filter(inv => inv.type === 'facture' && inv.status === 'Payé' && inv.clientName.toLowerCase().trim() === clientNameLower)
          .reduce((sum, inv) => sum + inv.total, 0);

        return {
          name: client.name,
          projects: clientProjects,
          revenue: clientRevenue,
          satisfaction: 0 // Pas de système de satisfaction pour le moment
        };
      })
      .filter(c => c.projects > 0 || c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [clients, projects, invoices]);

  // Calculer les heures par jour de la semaine (depuis les sessions de timer)
  const timeTrackingData = useMemo(() => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const hoursByDay: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    timerSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const dayOfWeek = sessionDate.getDay();
      hoursByDay[dayOfWeek] += session.duration / 3600; // Convertir secondes en heures
    });

    // Réorganiser pour commencer par Lundi
    return [
      { day: 'Lun', hours: Math.round(hoursByDay[1] * 10) / 10 },
      { day: 'Mar', hours: Math.round(hoursByDay[2] * 10) / 10 },
      { day: 'Mer', hours: Math.round(hoursByDay[3] * 10) / 10 },
      { day: 'Jeu', hours: Math.round(hoursByDay[4] * 10) / 10 },
      { day: 'Ven', hours: Math.round(hoursByDay[5] * 10) / 10 },
      { day: 'Sam', hours: Math.round(hoursByDay[6] * 10) / 10 },
      { day: 'Dim', hours: Math.round(hoursByDay[0] * 10) / 10 }
    ];
  }, [timerSessions]);

  // Calcul des KPIs
  const currentMonth = revenueData[revenueData.length - 1] || { revenue: 0, expenses: 0, projects: 0 };
  // Remplacer le nombre de projets "créés ce mois" par le vrai nombre de projets en cours
  const activeProjectsCount = projects.filter(p => p.status === 'En cours').length;
  const currentMonthWithActiveProjects = { ...currentMonth, projects: activeProjectsCount };
  const previousMonth = revenueData[revenueData.length - 2] || { revenue: 0, expenses: 0, projects: 0 };
  const revenueGrowth = previousMonth.revenue > 0
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;
  const totalHours = timeTrackingData.reduce((sum, day) => sum + day.hours, 0);

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Suivi de Projet</h1>
            <p className="text-purple-200">Tableau de bord analytique et rapports</p>
          </div>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="week" className="text-white">Cette semaine</SelectItem>
              <SelectItem value="month" className="text-white">Ce mois</SelectItem>
              <SelectItem value="quarter" className="text-white">Ce trimestre</SelectItem>
              <SelectItem value="year" className="text-white">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <KPICards
          currentMonth={currentMonthWithActiveProjects}
          revenueGrowth={revenueGrowth}
          totalHours={totalHours}
          clientsCount={clients.length}
          formatCurrency={formatCurrency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <RevenueChart data={revenueData} formatCurrency={formatCurrency} />
          <ProjectStatusChart data={projectStatusData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <TimeTrackingChart data={timeTrackingData} />
          <TopClients clients={clientsData} formatCurrency={formatCurrency} />
        </div>

        <AlertsSection />
      </div>
    </div>
  );
};

export default Suivi;
