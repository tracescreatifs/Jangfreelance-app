
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  title: string;
  icon: LucideIcon;
  description: string;
  onClick?: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon: Icon, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="glass-morphism p-4 rounded-xl card-hover w-full text-left group"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-medium">{title}</span>
        </div>
        <p className="text-purple-200 text-sm">{description}</p>
      </div>
    </button>
  );
};

export default QuickAction;
