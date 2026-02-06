
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  projects: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  formatCurrency: (amount: number) => string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, formatCurrency }) => {
  return (
    <Card className="glass-morphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Évolution Financière</CardTitle>
        <CardDescription className="text-purple-200">
          Revenus et dépenses sur les 6 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Revenus"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={3}
              name="Dépenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
