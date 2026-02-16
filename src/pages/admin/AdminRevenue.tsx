import React from 'react';
import AdminLayout from './AdminLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────

const formatXOF = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
};

const statusBadge = (status: string) => {
  const lower = status.toLowerCase();
  if (lower.includes('success') || lower.includes('completed')) {
    return {
      classes: 'bg-green-500/20 text-green-300 border-green-500/30',
      label: 'Succes',
    };
  }
  if (lower.includes('pending')) {
    return {
      classes: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      label: 'En attente',
    };
  }
  if (lower.includes('failed') || lower.includes('error')) {
    return {
      classes: 'bg-red-500/20 text-red-300 border-red-500/30',
      label: 'Echoue',
    };
  }
  return {
    classes: 'bg-white/10 text-white/60 border-white/20',
    label: status || '—',
  };
};

// ─── Loading Spinner ──────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Chargement des revenus...</p>
    </div>
  </div>
);

// ─── Admin Revenue Page ───────────────────────────────────────

const AdminRevenue: React.FC = () => {
  const {
    payments,
    loading,
    totalUsers,
    totalRevenue,
    monthlyRevenue,
  } = useAdmin();

  // Average revenue per user
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  // Payments sorted by date desc (already sorted from hook, but ensure order)
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // KPI definitions
  const kpiCards = [
    {
      title: 'CA Total',
      value: formatXOF(totalRevenue),
      icon: DollarSign,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
    },
    {
      title: 'CA Mensuel',
      value: formatXOF(monthlyRevenue),
      icon: Calendar,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
    },
    {
      title: 'CA Moyen/User',
      value: formatXOF(avgRevenuePerUser),
      icon: TrendingUp,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
    },
    {
      title: 'MRR',
      value: formatXOF(monthlyRevenue),
      icon: CreditCard,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-yellow-400" />
          Revenus
        </h2>
        <p className="text-white/50 text-sm mt-1">
          Suivi du chiffre d'affaires et des paiements
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Card
            key={kpi.title}
            className="glass-morphism border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wide">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments Table */}
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Tableau des paiements
            <Badge className="ml-2 bg-white/10 text-white/60 border-white/20">
              {payments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPayments.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">
              Aucun paiement enregistre pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Date</TableHead>
                    <TableHead className="text-white/50">Utilisateur</TableHead>
                    <TableHead className="text-white/50">Montant</TableHead>
                    <TableHead className="text-white/50 hidden sm:table-cell">
                      Plan
                    </TableHead>
                    <TableHead className="text-white/50 hidden md:table-cell">
                      Methode
                    </TableHead>
                    <TableHead className="text-white/50 text-right">
                      Statut
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => {
                    const badge = statusBadge(payment.status);
                    return (
                      <TableRow
                        key={payment.id}
                        className="border-white/5 hover:bg-white/5"
                      >
                        <TableCell className="text-white/70 text-sm">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate max-w-[180px]">
                              {payment.user_email || 'Inconnu'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          {formatXOF(payment.amount)}
                        </TableCell>
                        <TableCell className="text-white/60 hidden sm:table-cell">
                          {payment.plan_name || '—'}
                        </TableCell>
                        <TableCell className="text-white/50 hidden md:table-cell capitalize">
                          {payment.provider || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminRevenue;
