
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationCardProps {
  message: string;
  type: 'warning' | 'success';
  timestamp: Date;
  isRead: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ message, type, timestamp, isRead }) => {
  const Icon = type === 'warning' ? AlertTriangle : CheckCircle;
  const bgColor = type === 'warning' ? 'bg-yellow-500/20' : 'bg-green-500/20';
  const textColor = type === 'warning' ? 'text-yellow-300' : 'text-green-300';
  const borderColor = type === 'warning' ? 'border-yellow-500/30' : 'border-green-500/30';

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  return (
    <div className={`${bgColor} ${borderColor} border p-3 rounded-lg mb-3 ${!isRead ? 'ring-1 ring-purple-400/30' : ''}`}>
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${textColor}`} />
        <div className="flex-1">
          <p className={`text-sm ${textColor} font-medium`}>{message}</p>
          <p className="text-xs text-purple-300 mt-1">{formatTimestamp(timestamp)}</p>
        </div>
        {!isRead && (
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
