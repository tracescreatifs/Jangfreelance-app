
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeTrackingData {
  day: string;
  hours: number;
}

interface TimeTrackingChartProps {
  data: TimeTrackingData[];
}

const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({ data }) => {
  return (
    <Card className="glass-morphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Suivi du Temps</CardTitle>
        <CardDescription className="text-purple-200">
          Heures travaillées cette semaine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value}h`, 'Heures']}
            />
            <Bar dataKey="hours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeTrackingChart;
