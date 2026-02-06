
import React from 'react';

interface ProjectCardProps {
  title: string;
  client: string;
  deadline: string;
  status: 'En cours' | 'En attente' | 'Terminé';
  progress: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  title, 
  client, 
  deadline, 
  status, 
  progress 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'En cours':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'En attente':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Terminé':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="glass-morphism p-4 rounded-xl card-hover mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-semibold text-lg mb-1">{title}</h4>
          <p className="text-purple-200 text-sm">{client} • Échéance: {deadline}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
        >
          {status}
        </span>
      </div>
      
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProjectCard;
