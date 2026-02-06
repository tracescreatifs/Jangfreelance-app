
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react';
import { useInvoices } from '../../hooks/useInvoices';
import { useProjects } from '../../hooks/useProjects';

const AlertsSection: React.FC = () => {
  const { invoices } = useInvoices();
  const { projects } = useProjects();

  const alerts: { type: 'danger' | 'warning' | 'success' | 'info'; title: string; description: string }[] = [];

  // Factures en retard
  const facturesEnRetard = invoices.filter(inv => inv.status === 'En retard');
  facturesEnRetard.forEach(inv => {
    alerts.push({
      type: 'danger',
      title: 'Facture en retard',
      description: `${inv.clientName} - ${inv.number}`,
    });
  });

  // Factures envoyées non payées
  const facturesEnvoyees = invoices.filter(inv => inv.status === 'Envoyé');
  facturesEnvoyees.forEach(inv => {
    alerts.push({
      type: 'warning',
      title: 'Facture en attente de paiement',
      description: `${inv.clientName} - ${inv.number}`,
    });
  });

  // Projets en retard (deadline dépassée et pas terminé)
  const now = new Date();
  const projetsEnRetard = projects.filter(p => {
    if (p.status === 'Terminé' || !p.deadline) return false;
    return new Date(p.deadline) < now;
  });
  projetsEnRetard.forEach(p => {
    alerts.push({
      type: 'warning',
      title: 'Projet en retard',
      description: `${p.name} - Échéance dépassée`,
    });
  });

  // Message positif si pas d'alertes
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: 'Tout est en ordre',
      description: 'Aucune alerte pour le moment. Continuez comme ça !',
    });
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'danger': return { bg: 'bg-red-500/10 border-red-500/20', icon: <AlertTriangle className="w-5 h-5 text-red-400" />, textColor: 'text-red-300' };
      case 'warning': return { bg: 'bg-yellow-500/10 border-yellow-500/20', icon: <Clock className="w-5 h-5 text-yellow-400" />, textColor: 'text-yellow-300' };
      case 'success': return { bg: 'bg-green-500/10 border-green-500/20', icon: <CheckCircle className="w-5 h-5 text-green-400" />, textColor: 'text-green-300' };
      default: return { bg: 'bg-blue-500/10 border-blue-500/20', icon: <Info className="w-5 h-5 text-blue-400" />, textColor: 'text-blue-300' };
    }
  };

  return (
    <Card className="glass-morphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
          Alertes et Actions Requises
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const style = getAlertStyle(alert.type);
            return (
              <div key={index} className={`flex items-center p-4 ${style.bg} border rounded-lg`}>
                <div className="flex items-center space-x-3">
                  {style.icon}
                  <div>
                    <div className="text-white font-medium">{alert.title}</div>
                    <div className={`${style.textColor} text-sm`}>{alert.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsSection;
