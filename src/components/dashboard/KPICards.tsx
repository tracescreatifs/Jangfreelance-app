
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, BarChart3, Timer, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardsProps {
  currentMonth: {
    revenue: number;
    projects: number;
  };
  revenueGrowth: number;
  totalHours: number;
  clientsCount: number;
  formatCurrency: (amount: number) => string;
}

const KPICards: React.FC<KPICardsProps> = ({ 
  currentMonth, 
  revenueGrowth, 
  totalHours, 
  clientsCount, 
  formatCurrency 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card className="glass-morphism border-white/20">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
            Revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
            {formatCurrency(currentMonth.revenue)}
          </div>
          <div className={`flex items-center text-xs sm:text-sm ${revenueGrowth === 0 ? 'text-purple-200' : revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {revenueGrowth === 0 ? (
              <span>Ce mois-ci</span>
            ) : (
              <>
                {revenueGrowth > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                {Math.abs(revenueGrowth).toFixed(1)}% vs mois dernier
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-white/20">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
            Projets Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
            {currentMonth.projects}
          </div>
          <div className="text-xs sm:text-sm text-purple-200">
            En cours
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-white/20">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
            Temps Travaillé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-2">
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-xs sm:text-sm text-purple-200">
            Cette semaine
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-white/20">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
            Clients Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
            {clientsCount}
          </div>
          <div className="text-xs sm:text-sm text-purple-200">
            Total enregistrés
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;
