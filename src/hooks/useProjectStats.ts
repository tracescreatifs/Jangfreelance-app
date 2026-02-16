import { useMemo, useState, useEffect } from 'react';
import { useProjects } from './useProjects';
import { useInvoices } from './useInvoices';
import { useTransactions } from './useTransactions';

// ── Types ────────────────────────────────────────────────────────────

interface TimerSession {
  id: string;
  projectId: string;
  projectName: string;
  projectStatus: string;
  duration: number; // secondes
  date: string;
}

export interface ProjectStat {
  paidAmount: number;    // Montant factures payées (CFA)
  timeTracked: number;   // Temps suivi en secondes
  spentAmount: number;   // Dépenses liées via factures (CFA)
}

const TIMER_STORAGE_KEY = 'timer-sessions';

// ── Helper : formatage durée ─────────────────────────────────────────

export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

// ── Hook ─────────────────────────────────────────────────────────────

export const useProjectStats = () => {
  const { projects } = useProjects();
  const { invoices } = useInvoices();
  const { transactions } = useTransactions();
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);

  // Charger les sessions timer depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        setTimerSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Erreur lecture sessions timer:', e);
    }

    // Écouter les changements localStorage (si timer tourne dans un autre onglet/composant)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TIMER_STORAGE_KEY && e.newValue) {
        try {
          setTimerSessions(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Re-lire périodiquement pour capter les mises à jour du timer (même onglet)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(TIMER_STORAGE_KEY);
        if (stored) {
          setTimerSessions(JSON.parse(stored));
        }
      } catch {}
    }, 10000); // toutes les 10 secondes
    return () => clearInterval(interval);
  }, []);

  // Calculer les stats par projet
  const projectStats = useMemo(() => {
    const stats = new Map<string, ProjectStat>();

    // ── 1. Factures payées ──
    const paidInvoices = invoices.filter(inv => inv.type === 'facture' && inv.status === 'Payé');

    // ── 1b. Dépenses liées à une facture ──
    const linkedExpenses = transactions.filter(t => t.type === 'depense' && t.facture);

    // ── 2. Temps timer par projectId ──
    const timeByProject = new Map<string, number>();
    timerSessions.forEach(session => {
      if (session.projectId) {
        timeByProject.set(
          session.projectId,
          (timeByProject.get(session.projectId) || 0) + session.duration
        );
      }
    });

    // ── 3. Assembler les stats par projet ──
    // Note : project.clientName = "Nom - Entreprise", invoice.clientName = "Nom"
    // → on extrait le nom (avant " - ") pour comparer
    const extractName = (fullClientName: string) =>
      fullClientName.split(' - ')[0].toLowerCase().trim();

    projects.forEach(project => {
      const projectClientName = extractName(project.clientName);
      const projectNameLower = project.name.toLowerCase().trim();

      // Trouver les factures payées de CE client
      const clientPaidInvoices = paidInvoices.filter(inv =>
        inv.clientName.toLowerCase().trim() === projectClientName
      );

      // Combien de projets ce client a-t-il ?
      const clientProjects = projects.filter(p =>
        extractName(p.clientName) === projectClientName
      );

      let paidAmount = 0;
      if (clientProjects.length === 1) {
        // Un seul projet → toutes les factures payées du client
        paidAmount = clientPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
      } else {
        // Plusieurs projets → matcher par titre de facture contenant le nom du projet
        paidAmount = clientPaidInvoices
          .filter(inv => {
            const titleLower = inv.title.toLowerCase().trim();
            return titleLower.includes(projectNameLower) || titleLower === projectNameLower;
          })
          .reduce((sum, inv) => sum + inv.total, 0);
      }

      // ── Dépenses liées via les factures ──
      let spentAmount = 0;
      linkedExpenses.forEach(expense => {
        const linkedInvoice = invoices.find(inv => inv.number === expense.facture);
        if (!linkedInvoice) return;

        const invoiceClientName = linkedInvoice.clientName.toLowerCase().trim();
        if (invoiceClientName !== projectClientName) return;

        if (clientProjects.length === 1) {
          spentAmount += expense.montant;
        } else {
          const titleLower = linkedInvoice.title.toLowerCase().trim();
          if (titleLower.includes(projectNameLower) || titleLower === projectNameLower) {
            spentAmount += expense.montant;
          }
        }
      });

      stats.set(project.id, {
        paidAmount,
        timeTracked: timeByProject.get(project.id) || 0,
        spentAmount,
      });
    });

    return stats;
  }, [projects, invoices, timerSessions, transactions]);

  // Totaux globaux
  const totals = useMemo(() => {
    let totalPaidAmount = 0;
    let totalTimeTracked = 0;

    projectStats.forEach(stat => {
      totalPaidAmount += stat.paidAmount;
      totalTimeTracked += stat.timeTracked;
    });

    return { totalPaidAmount, totalTimeTracked };
  }, [projectStats]);

  return {
    projectStats,
    totalPaidAmount: totals.totalPaidAmount,
    totalTimeTracked: totals.totalTimeTracked,
  };
};
