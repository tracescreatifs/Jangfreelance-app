import React, { useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
} from 'lucide-react';

// ─── Currency Formatter ────────────────────────────────────────
const formatXOF = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(value);

// ─── Date Formatter ────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
};

// ─── Role Badge ────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colorMap: Record<string, string> = {
    admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    user: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    moderator: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const classes = colorMap[role] || colorMap.user;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {role}
    </span>
  );
};

// ─── Loading Spinner ───────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Chargement des donnees...</p>
    </div>
  </div>
);

// ─── Admin Dashboard ───────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const {
    users,
    payments,
    loading,
    totalUsers,
    activeUsers,
    totalRevenue,
    churnRate,
    activationRate,
  } = useAdmin();

  // Derniers 5 utilisateurs inscrits
  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [users]);

  // Derniers 5 paiements
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [payments]);

  // ── KPI card definitions ────────────────────────────────────
  const kpiCards = [
    {
      title: 'Utilisateurs totaux',
      value: totalUsers.toString(),
      icon: Users,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
    },
    {
      title: 'Utilisateurs actifs',
      value: activeUsers.toString(),
      icon: UserCheck,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
    },
    {
      title: 'CA Total',
      value: formatXOF(totalRevenue),
      icon: DollarSign,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
    },
    {
      title: 'Taux de churn',
      value: `${churnRate.toFixed(1)}%`,
      icon: TrendingDown,
      iconColor: churnRate > 10 ? 'text-red-400' : 'text-white/70',
      iconBg: churnRate > 10 ? 'bg-red-500/20' : 'bg-white/10',
      valueColor: churnRate > 10 ? 'text-red-400' : undefined,
    },
    {
      title: "Taux d'activation",
      value: `${activationRate.toFixed(1)}%`,
      icon: Activity,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
      valueColor: 'text-green-400',
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
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-white/50 text-sm mt-1">
          Vue d'ensemble de la plateforme Jang
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              <p
                className={`text-2xl font-bold ${kpi.valueColor || 'text-white'}`}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section: Recent Users + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers utilisateurs inscrits */}
        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Derniers utilisateurs inscrits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">
                Aucun utilisateur pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.full_name || 'Sans nom'}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <RoleBadge role={user.role} />
                      <span className="text-xs text-white/30">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Derniers paiements */}
        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Derniers paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">
                Aucun paiement pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {payment.user_email || 'Inconnu'}
                      </p>
                      <p className="text-xs text-white/40">
                        {payment.plan_name || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="text-sm font-semibold text-green-400">
                        {formatXOF(payment.amount)}
                      </span>
                      <span className="text-xs text-white/30">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
