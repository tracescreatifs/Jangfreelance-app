
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, Square, Clock, Filter, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useProjects } from '../hooks/useProjects';

interface TimerSession {
  id: string;
  projectId: string;
  projectName: string;
  projectStatus: string;
  duration: number;
  date: string;
}

interface TimerProps {
  isMinimal?: boolean;
}

const STORAGE_KEY = 'timer-sessions';

const Timer: React.FC<TimerProps> = ({ isMinimal = false }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'en_cours' | 'termine'>('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const { projects } = useProjects();

  // Projets actifs pour le sélecteur (En cours ou En pause)
  const activeProjects = projects.filter(project =>
    project.status === 'En cours' || project.status === 'En pause'
  );

  // Projet sélectionné
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Charger les sessions depuis localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        // Migration: ajouter projectId si absent (anciennes sessions)
        const migrated = parsed.map((s: any) => ({
          ...s,
          projectId: s.projectId || '',
          projectStatus: s.projectStatus || 'En cours'
        }));
        setSessions(migrated);
      } catch (e) {
        console.error('Erreur lecture sessions:', e);
      }
    }
  }, []);

  // Ref pour accéder aux sessions sans les inclure dans les deps (évite boucle infinie)
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  // Mettre à jour le statut des projets dans les sessions quand les projets changent
  useEffect(() => {
    if (projects.length === 0 || sessionsRef.current.length === 0) return;

    let hasChanges = false;
    const updated = sessionsRef.current.map(session => {
      const project = projects.find(p => p.id === session.projectId || p.name === session.projectName);
      if (project && project.status !== session.projectStatus) {
        hasChanges = true;
        return { ...session, projectId: project.id, projectStatus: project.status };
      }
      if (project && !session.projectId) {
        hasChanges = true;
        return { ...session, projectId: project.id };
      }
      return session;
    });

    if (hasChanges) {
      setSessions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [projects]);

  // Sauvegarder les sessions dans localStorage
  const saveSessions = (newSessions: TimerSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  };

  // Timer interval
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

  const formatHoursMinutes = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}min`;
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  };

  const handleStart = () => {
    if (!selectedProjectId) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (time > 0 && selectedProject) {
      const today = new Date().toISOString().split('T')[0];

      // Chercher une session existante pour le même projet aujourd'hui
      const existingSessionIndex = sessions.findIndex(
        session => session.projectId === selectedProject.id && session.date === today
      );

      if (existingSessionIndex !== -1) {
        const updatedSessions = [...sessions];
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          duration: updatedSessions[existingSessionIndex].duration + time,
          projectStatus: selectedProject.status
        };
        saveSessions(updatedSessions);
      } else {
        const newSession: TimerSession = {
          id: Date.now().toString(),
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          projectStatus: selectedProject.status,
          duration: time,
          date: today
        };
        saveSessions([newSession, ...sessions]);
      }
    }

    setIsRunning(false);
    setTime(0);
  };

  const deleteSession = (sessionId: string) => {
    if (window.confirm('Supprimer cette session ?')) {
      const updated = sessions.filter(s => s.id !== sessionId);
      saveSessions(updated);
    }
  };

  // Grouper les sessions par projet avec temps total
  const projectStats = useMemo(() => {
    const stats: Record<string, {
      projectId: string;
      projectName: string;
      projectStatus: string;
      totalDuration: number;
      sessions: TimerSession[];
    }> = {};

    sessions.forEach(session => {
      const key = session.projectId || session.projectName;
      if (!stats[key]) {
        stats[key] = {
          projectId: session.projectId,
          projectName: session.projectName,
          projectStatus: session.projectStatus,
          totalDuration: 0,
          sessions: []
        };
      }
      stats[key].totalDuration += session.duration;
      stats[key].sessions.push(session);
    });

    // Trier par temps total décroissant
    return Object.values(stats).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [sessions]);

  // Filtrer les stats par statut
  const filteredStats = useMemo(() => {
    if (historyFilter === 'all') return projectStats;
    if (historyFilter === 'en_cours') {
      return projectStats.filter(s => s.projectStatus === 'En cours' || s.projectStatus === 'En pause');
    }
    return projectStats.filter(s => s.projectStatus === 'Terminé');
  }, [projectStats, historyFilter]);

  // Temps total tous projets
  const totalTime = useMemo(() => {
    return sessions.reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  // Temps total cette semaine
  const weeklyTime = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
    startOfWeek.setHours(0, 0, 0, 0);
    const startStr = startOfWeek.toISOString().split('T')[0];

    return sessions
      .filter(s => s.date >= startStr)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  if (isMinimal) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3 glass-morphism px-3 sm:px-4 py-2 rounded-lg">
        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white/50" />
        <span className="text-white font-mono text-xs sm:text-sm">{formatTime(time)}</span>
        {isRunning && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer principal */}
      <div className="glass-morphism p-4 sm:p-6 lg:p-8 rounded-2xl">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Timer de Projet</h2>

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
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full max-w-md mx-auto bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionner un projet actif" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 max-h-60 overflow-y-auto">
                    {activeProjects.map(project => (
                      <SelectItem key={project.id} value={project.id} className="text-white">
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
                  <div className="text-white/50 text-sm sm:text-base">
                    Projet: {selectedProject.name}
                  </div>
                )}
                {isRunning && (
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">En cours d'enregistrement...</span>
                  </div>
                )}
              </div>

              {/* Contrôles */}
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleStart}
                  disabled={!selectedProjectId || isRunning}
                  className="bg-white text-black hover:bg-white/90 hover:scale-105 transition-transform w-full sm:w-auto"
                  size="lg"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Démarrer
                </Button>

                <Button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="bg-white/20 text-white hover:bg-white/30 hover:scale-105 transition-transform w-full sm:w-auto"
                  size="lg"
                >
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Pause
                </Button>

                <Button
                  onClick={handleStop}
                  disabled={time === 0}
                  className="bg-red-500/80 text-white hover:bg-red-500 hover:scale-105 transition-transform w-full sm:w-auto"
                  size="lg"
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Arrêter
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Statistiques résumées */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white font-mono">{formatHoursMinutes(totalTime)}</div>
            <div className="text-white/40 text-xs mt-1">Temps total</div>
          </div>
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white font-mono">{formatHoursMinutes(weeklyTime)}</div>
            <div className="text-white/40 text-xs mt-1">Cette semaine</div>
          </div>
          <div className="glass-morphism p-4 rounded-xl text-center col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold text-white">{projectStats.length}</div>
            <div className="text-white/40 text-xs mt-1">Projets suivis</div>
          </div>
        </div>
      )}

      {/* Historique par projet */}
      {sessions.length > 0 && (
        <div className="glass-morphism p-4 sm:p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
            <h3 className="text-lg sm:text-xl font-bold text-white">Temps par Projet</h3>

            {/* Filtre */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-white/40" />
              <Select value={historyFilter} onValueChange={(v: any) => setHistoryFilter(v)}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all" className="text-white">Tous</SelectItem>
                  <SelectItem value="en_cours" className="text-white">En cours</SelectItem>
                  <SelectItem value="termine" className="text-white">Terminés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredStats.length === 0 ? (
            <div className="text-center py-6 text-white/30">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune session pour ce filtre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStats.map((stat) => {
                const isExpanded = expandedProject === stat.projectId;
                const isTerminated = stat.projectStatus === 'Terminé';

                return (
                  <div key={stat.projectId || stat.projectName} className="rounded-xl overflow-hidden">
                    {/* Ligne projet */}
                    <button
                      onClick={() => setExpandedProject(isExpanded ? null : stat.projectId)}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${
                        isTerminated
                          ? 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/20'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      } rounded-xl`}
                    >
                      <div className="flex items-center space-x-3">
                        {isTerminated ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        )}
                        <div className="text-left">
                          <div className="text-white font-medium text-sm sm:text-base">
                            {stat.projectName}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <Badge className={`text-[10px] px-1.5 py-0 ${
                              isTerminated ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {stat.projectStatus}
                            </Badge>
                            <span className="text-white/30 text-xs">
                              {stat.sessions.length} session{stat.sessions.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-white font-mono font-bold text-sm sm:text-base">
                            {formatHoursMinutes(stat.totalDuration)}
                          </div>
                          <div className="text-white/30 text-xs font-mono">
                            {formatTime(stat.totalDuration)}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-white/30" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                    </button>

                    {/* Détails des sessions */}
                    {isExpanded && (
                      <div className="mt-1 space-y-1 pl-4 sm:pl-8">
                        {stat.sessions
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(session => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-white/50 text-sm">
                                  {new Date(session.date).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-white font-mono text-sm">
                                  {formatTime(session.duration)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSession(session.id)}
                                  className="text-red-400/50 hover:text-red-400 hover:bg-white/5 p-1 h-7 w-7"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;
