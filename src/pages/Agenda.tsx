import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAgenda, getEventsForDate, type AgendaEvent, type AgendaEventType, type AgendaEventStatus, type AgendaEventPriority } from '@/hooks/useAgenda';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, CalendarIcon, CheckSquare, Users, CalendarDays, Bell,
  Circle, CheckCircle2, Pencil, Trash2, FileText, Clock,
} from 'lucide-react';

// ── Config ───────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<AgendaEventType, { label: string; icon: React.ElementType; color: string }> = {
  task:        { label: 'Tâche',       icon: CheckSquare,  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  meeting:     { label: 'Réunion',     icon: Users,        color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  appointment: { label: 'Rendez-vous', icon: CalendarDays, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  reminder:    { label: 'Rappel',      icon: Bell,         color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

const PRIORITY_CONFIG: Record<AgendaEventPriority, { label: string; color: string }> = {
  low:    { label: 'Basse',   color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  medium: { label: 'Moyenne', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  high:   { label: 'Haute',   color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

// ── Form state ───────────────────────────────────────────────

interface FormData {
  title: string;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaEventPriority;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  allDay: boolean;
  clientId: string | null;
  projectId: string | null;
  description: string;
  notes: string;
}

const defaultFormData: FormData = {
  title: '',
  type: 'task',
  status: 'pending',
  priority: 'medium',
  startDate: undefined,
  startTime: '09:00',
  endDate: undefined,
  endTime: '10:00',
  allDay: false,
  clientId: null,
  projectId: null,
  description: '',
  notes: '',
};

// ── Page ─────────────────────────────────────────────────────

const Agenda: React.FC = () => {
  const { events, loading, addEvent, updateEvent, deleteEvent, toggleEventStatus } = useAgenda();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<AgendaEventType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Computed data ────────────────────────────────────────

  const eventsForDate = useMemo(() => getEventsForDate(events, selectedDate), [events, selectedDate]);

  const filteredEventsForDate = useMemo(
    () => filter === 'all' ? eventsForDate : eventsForDate.filter(e => e.type === filter),
    [eventsForDate, filter]
  );

  const datesWithEvents = useMemo(() => {
    const dates: Date[] = [];
    const seen = new Set<string>();
    events.forEach(e => {
      if (e.startDate) {
        const dayStr = e.startDate.split('T')[0];
        if (!seen.has(dayStr)) {
          seen.add(dayStr);
          dates.push(new Date(dayStr + 'T12:00:00'));
        }
      }
    });
    return dates;
  }, [events]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const pendingTasks = events.filter(e => e.type === 'task' && e.status !== 'completed' && e.status !== 'cancelled').length;
    const todayEvents = events.filter(e => e.startDate && e.startDate.split('T')[0] === todayStr).length;
    const weekMeetings = events.filter(e => {
      if (e.type !== 'meeting' || !e.startDate) return false;
      const d = new Date(e.startDate);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    }).length;
    const nonCancelled = events.filter(e => e.status !== 'cancelled');
    const completed = nonCancelled.filter(e => e.status === 'completed').length;
    const completionRate = nonCancelled.length > 0 ? Math.round((completed / nonCancelled.length) * 100) : 0;

    return { pendingTasks, todayEvents, weekMeetings, completionRate };
  }, [events]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

  const filteredProjects = useMemo(
    () => formData.clientId ? projects.filter(p => p.clientId === formData.clientId) : projects,
    [projects, formData.clientId]
  );

  // ── Modal helpers ────────────────────────────────────────

  const openNewEventModal = () => {
    setEditingEvent(null);
    setFormData({
      ...defaultFormData,
      startDate: selectedDate,
      endDate: selectedDate,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: AgendaEvent) => {
    setEditingEvent(event);
    const startD = event.startDate ? new Date(event.startDate) : undefined;
    const endD = event.endDate ? new Date(event.endDate) : undefined;
    setFormData({
      title: event.title,
      type: event.type,
      status: event.status,
      priority: event.priority,
      startDate: startD,
      startTime: startD ? format(startD, 'HH:mm') : '09:00',
      endDate: endD,
      endTime: endD ? format(endD, 'HH:mm') : '10:00',
      allDay: event.allDay,
      clientId: event.clientId,
      projectId: event.projectId,
      description: event.description,
      notes: event.notes,
    });
    setIsModalOpen(true);
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset project quand le client change
      if (field === 'clientId' && value !== prev.clientId) {
        updated.projectId = null;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate) return;

    setIsSubmitting(true);

    // Combiner date + heure
    let startDateISO: string;
    let endDateISO: string | null = null;

    if (formData.allDay) {
      startDateISO = formData.startDate.toISOString();
      endDateISO = formData.endDate ? formData.endDate.toISOString() : null;
    } else {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const sd = new Date(formData.startDate);
      sd.setHours(sh, sm, 0, 0);
      startDateISO = sd.toISOString();

      if (formData.endDate || formData.endTime) {
        const ed = new Date(formData.endDate || formData.startDate);
        const [eh, em] = formData.endTime.split(':').map(Number);
        ed.setHours(eh, em, 0, 0);
        endDateISO = ed.toISOString();
      }
    }

    try {
      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        startDate: startDateISO,
        endDate: endDateISO,
        allDay: formData.allDay,
        clientId: formData.clientId,
        projectId: formData.projectId,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        toast({ title: 'Événement modifié', description: `"${formData.title}" a été mis à jour.` });
      } else {
        await addEvent(payload);
        toast({ title: 'Événement créé', description: `"${formData.title}" a été ajouté.` });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: AgendaEvent) => {
    if (!window.confirm(`Supprimer "${event.title}" ?\nL'événement sera déplacé dans la corbeille.`)) return;
    try {
      await deleteEvent(event.id);
      toast({ title: 'Supprimé', description: `"${event.title}" a été déplacé dans la corbeille.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  const handleToggle = async (event: AgendaEvent) => {
    await toggleEventStatus(event.id, event.status);
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-white/60" />
              Agenda
            </h2>
            <p className="text-white/50 text-sm mt-1">Gérez vos tâches, rendez-vous et réunions</p>
          </div>
          <Button
            onClick={openNewEventModal}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Tâches en attente', value: stats.pendingTasks, icon: CheckSquare },
            { label: "Aujourd'hui", value: stats.todayEvents, icon: CalendarIcon },
            { label: 'Réunions (semaine)', value: stats.weekMeetings, icon: Users },
            { label: 'Complétion', value: `${stats.completionRate}%`, icon: CheckCircle2 },
          ].map((s, i) => (
            <div key={i} className="glass-morphism p-4 rounded-2xl text-center">
              <s.icon className="w-5 h-5 mx-auto text-white/40 mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-white/40 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Calendar + Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Calendar */}
            <div className="glass-morphism p-4 rounded-2xl">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => setSelectedDate(date || new Date())}
                locale={fr}
                modifiers={{ hasEvents: datesWithEvents }}
                modifiersStyles={{ hasEvents: { fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'rgba(34,197,94,0.6)' } }}
                className="text-white w-full"
              />
            </div>

            {/* Type filters */}
            <div className="glass-morphism p-4 rounded-2xl">
              <h3 className="text-white font-medium text-sm mb-3">Filtrer par type</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-white/15 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'}
                >
                  Tout ({eventsForDate.length})
                </Button>
                {(Object.keys(EVENT_TYPE_CONFIG) as AgendaEventType[]).map((type) => {
                  const config = EVENT_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  const count = eventsForDate.filter(e => e.type === type).length;
                  return (
                    <Button
                      key={type}
                      variant={filter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(type)}
                      className={filter === type ? 'bg-white/15 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'}
                    >
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {config.label} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Events list */}
          <div className="lg:col-span-2">
            <div className="glass-morphism p-4 sm:p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                </h3>
                <Badge className="bg-white/10 text-white/60 border-white/10">
                  {filteredEventsForDate.length} événement{filteredEventsForDate.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : filteredEventsForDate.length === 0 ? (
                <div className="text-center py-16">
                  <CalendarDays className="w-14 h-14 mx-auto text-white/15 mb-3" />
                  <p className="text-white/40 text-sm mb-4">Aucun événement pour cette date</p>
                  <Button
                    onClick={openNewEventModal}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEventsForDate.map(event => {
                    const typeConf = EVENT_TYPE_CONFIG[event.type];
                    const prioConf = PRIORITY_CONFIG[event.priority];
                    const TypeIcon = typeConf.icon;

                    return (
                      <div
                        key={event.id}
                        className="glass-morphism p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConf.color.split(' ')[0]}`}>
                              <TypeIcon className="w-5 h-5 text-white/60" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${event.status === 'completed' ? 'line-through text-white/40' : 'text-white'}`}>
                                {event.title}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${prioConf.color}`}>
                                {prioConf.label}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${typeConf.color}`}>
                                {typeConf.label}
                              </span>
                            </div>

                            {event.startDate && !event.allDay && (
                              <p className="text-white/40 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.startDate), 'HH:mm')}
                                {event.endDate && ` - ${format(new Date(event.endDate), 'HH:mm')}`}
                              </p>
                            )}

                            {event.allDay && (
                              <p className="text-white/40 text-xs">Toute la journée</p>
                            )}

                            {event.description && (
                              <p className="text-white/30 text-xs mt-1 truncate">{event.description}</p>
                            )}

                            {/* Client / Project tags */}
                            {(event.clientId || event.projectId) && (
                              <div className="flex gap-2 mt-2">
                                {event.clientId && clientMap.get(event.clientId) && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                    {clientMap.get(event.clientId)}
                                  </span>
                                )}
                                {event.projectId && projectMap.get(event.projectId) && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/20">
                                    {projectMap.get(event.projectId)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Meeting notes preview */}
                            {event.type === 'meeting' && event.notes && (
                              <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5">
                                <p className="text-white/30 text-xs flex items-center gap-1 mb-1">
                                  <FileText className="w-3 h-3" /> Notes
                                </p>
                                <p className="text-white/50 text-xs line-clamp-2">{event.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(event)}
                              className="h-8 w-8 p-0"
                              title={event.status === 'completed' ? 'Marquer comme en attente' : 'Marquer comme terminé'}
                            >
                              {event.status === 'completed'
                                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                                : <Circle className="w-4 h-4 text-white/30 hover:text-white/60" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(event)}
                              className="h-8 w-8 p-0 text-white/40 hover:text-white"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(event)}
                              className="h-8 w-8 p-0 text-red-400/50 hover:text-red-400"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Create / Edit Modal ──────────────────────────── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[550px] glass-morphism border-white/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {editingEvent ? "Modifier l'événement" : 'Nouvel événement'}
              </DialogTitle>
              <DialogDescription className="text-white/50">
                {editingEvent ? "Modifiez les détails de l'événement" : 'Planifiez un nouvel événement'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titre */}
              <div>
                <Label className="text-white text-sm">Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                  placeholder="Ex: Réunion client design"
                  required
                />
              </div>

              {/* Type + Priorité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="task" className="text-white">Tâche</SelectItem>
                      <SelectItem value="meeting" className="text-white">Réunion</SelectItem>
                      <SelectItem value="appointment" className="text-white">Rendez-vous</SelectItem>
                      <SelectItem value="reminder" className="text-white">Rappel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white text-sm">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="low" className="text-white">Basse</SelectItem>
                      <SelectItem value="medium" className="text-white">Moyenne</SelectItem>
                      <SelectItem value="high" className="text-white">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Date début *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white justify-start font-normal hover:bg-white/15"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/40" />
                        {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy') : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(d) => handleChange('startDate', d)}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-white text-sm">Date fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white justify-start font-normal hover:bg-white/15"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-white/40" />
                        {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy') : 'Optionnel'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(d) => handleChange('endDate', d)}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Heures (masquées si allDay) */}
              {!formData.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm">Heure début</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={e => handleChange('startTime', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm">Heure fin</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={e => handleChange('endTime', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}

              {/* All Day toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.allDay}
                  onCheckedChange={(v) => handleChange('allDay', v)}
                />
                <Label className="text-white text-sm cursor-pointer">Toute la journée</Label>
              </div>

              {/* Client + Projet */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white text-sm">Client (optionnel)</Label>
                  <Select
                    value={formData.clientId || 'none'}
                    onValueChange={(v) => handleChange('clientId', v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 max-h-48">
                      <SelectItem value="none" className="text-white/50">Aucun</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-white">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white text-sm">Projet (optionnel)</Label>
                  <Select
                    value={formData.projectId || 'none'}
                    onValueChange={(v) => handleChange('projectId', v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 max-h-48">
                      <SelectItem value="none" className="text-white/50">Aucun</SelectItem>
                      {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-white text-sm">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                  rows={2}
                  placeholder="Détails de l'événement..."
                />
              </div>

              {/* Notes de réunion (visible seulement pour meeting) */}
              {formData.type === 'meeting' && (
                <div>
                  <Label className="text-white text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Notes de réunion
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => handleChange('notes', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                    rows={4}
                    placeholder="Points discutés, décisions prises, actions à suivre..."
                  />
                </div>
              )}

              {/* Footer */}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.startDate}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {isSubmitting ? 'Enregistrement...' : (editingEvent ? 'Modifier' : 'Créer')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Agenda;
