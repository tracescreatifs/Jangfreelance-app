
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useProjects } from '../hooks/useProjects';

interface TimerSession {
  id: string;
  projectName: string;
  duration: number;
  date: string;
}

interface TimerProps {
  isMinimal?: boolean;
}

const Timer: React.FC<TimerProps> = ({ isMinimal = false }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  
  const { projects } = useProjects();

  // Filtrer les projets actifs (En cours ou En pause)
  const activeProjects = projects.filter(project => 
    project.status === 'En cours' || project.status === 'En pause'
  );

  // Charger les sessions depuis localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('timer-sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Sauvegarder les sessions dans localStorage
  const saveSessions = (newSessions: TimerSession[]) => {
    setSessions(newSessions);
    localStorage.setItem('timer-sessions', JSON.stringify(newSessions));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedProject) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    if (time > 0 && selectedProject) {
      const today = new Date().toISOString().split('T')[0];
      
      // Chercher une session existante pour le même projet aujourd'hui
      const existingSessionIndex = sessions.findIndex(
        session => session.projectName === selectedProject && session.date === today
      );

      if (existingSessionIndex !== -1) {
        // Additionner le temps à la session existante
        const updatedSessions = [...sessions];
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          duration: updatedSessions[existingSessionIndex].duration + time
        };
        saveSessions(updatedSessions);
      } else {
        // Créer une nouvelle session
        const newSession: TimerSession = {
          id: Date.now().toString(),
          projectName: selectedProject,
          duration: time,
          date: today
        };
        saveSessions([newSession, ...sessions]);
      }
    }
    
    setIsRunning(false);
    setTime(0);
  };

  if (isMinimal) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3 glass-morphism px-3 sm:px-4 py-2 rounded-lg">
        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
        <span className="text-white font-mono text-xs sm:text-sm">{formatTime(time)}</span>
        {isRunning && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />}
      </div>
    );
  }

  return (
    <div className="glass-morphism p-4 sm:p-6 lg:p-8 rounded-2xl max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Timer de Projet</h2>
        
        {/* Message si aucun projet actif */}
        {activeProjects.length === 0 ? (
          <div className="mb-6 sm:mb-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200">
              Aucun projet actif trouvé. Créez d'abord un projet avec le statut "En cours" depuis la page Projets.
            </p>
          </div>
        ) : (
          <>
            {/* Sélection du projet */}
            <div className="mb-6 sm:mb-8">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full max-w-md mx-auto bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sélectionner un projet actif" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 max-h-60 overflow-y-auto">
                  {activeProjects.map(project => (
                    <SelectItem key={project.id} value={project.name} className="text-white">
                      {project.name} - {project.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Affichage du temps */}
            <div className="mb-6 sm:mb-8">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-white mb-4">
                {formatTime(time)}
              </div>
              {selectedProject && (
                <div className="text-purple-200 text-sm sm:text-base">
                  Projet: {selectedProject}
                </div>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
              <Button
                onClick={handleStart}
                disabled={!selectedProject || isRunning}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform w-full sm:w-auto"
                size="lg"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Démarrer
              </Button>
              
              <Button
                onClick={handlePause}
                disabled={!isRunning}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-transform w-full sm:w-auto"
                size="lg"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Pause
              </Button>
              
              <Button
                onClick={handleReset}
                disabled={time === 0}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition-transform w-full sm:w-auto"
                size="lg"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Arrêter
              </Button>
            </div>
          </>
        )}

        {/* Historique des sessions */}
        {sessions.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Historique des Sessions</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sessions.map(session => (
                <div key={session.id} className="bg-white/5 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div className="text-left">
                    <div className="text-white font-medium text-sm sm:text-base">{session.projectName}</div>
                    <div className="text-purple-300 text-xs sm:text-sm">{new Date(session.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="text-green-300 font-mono font-bold text-sm sm:text-base">
                    {formatTime(session.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timer;
