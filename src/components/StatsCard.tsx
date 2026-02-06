
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color 
}) => {
  return (
    <div className="glass-morphism p-6 rounded-2xl card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      
      <div className="flex items-center">
        <span
          className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-300' : 'text-red-300'
          }`}
        >
          {changeType === 'positive' ? '↗' : '↘'} {change}
        </span>
      </div>
    </div>
  );
};

export default StatsCard;
