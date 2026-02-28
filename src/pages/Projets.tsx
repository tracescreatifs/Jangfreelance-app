import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Search, Clock, DollarSign } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import NewProjectModal from '../components/modals/NewProjectModal';
import ProjectSteps from '../components/ProjectSteps';
import { toast } from '../components/ui/use-toast';
import { useProjectStats, formatTime } from '../hooks/useProjectStats';

const Projets = () => {
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useProjects();
  const { clients, updateClient } = useClients();
  const { projectStats, totalPaidAmount, totalTimeTracked } = useProjectStats();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Ref pour tracker la progression en temps réel depuis ProjectSteps
  const currentProgressRef = useRef<number>(0);

  const statusColors = {
    'En cours': 'bg-blue-500',
    'Terminé': 'bg-green-500',
    'En pause': 'bg-yellow-500',
    'Annulé': 'bg-red-500'
  };

  const priorityColors = {
    'Haute': 'bg-red-500',
    'Moyenne': 'bg-yellow-500',
    'Basse': 'bg-green-500'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleStatusChange = async (project: any, newStatus: string) => {
    if (newStatus === project.status) return;
    await updateProject(project.id, { status: newStatus });
    toast({
      title: "Statut mis à jour",
      description: `${project.name} → ${newStatus}`,
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    currentProgressRef.current = project.progress;
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Diminuer le compteur de projets du client
        const client = clients.find(c => c.id === project.clientId);
        if (client && client.projects > 0) {
          await updateClient(client.id, {
            projects: client.projects - 1
          });
        }
      }

      await deleteProject(projectId);
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
        variant: "default"
      });
    }
  };

  const handleProgressChange = (projectId: string, newProgress: number) => {
    currentProgressRef.current = newProgress;
    // Mettre à jour immédiatement dans Supabase aussi
    updateProject(projectId, { progress: newProgress });
    setSelectedProject((prev: any) => prev ? { ...prev, progress: newProgress } : null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      name: formData.get('name') as string,
      status: formData.get('status') as any,
      priority: formData.get('priority') as any,
      budget: parseFloat(formData.get('budget') as string),
      spent: parseFloat(formData.get('spent') as string),
      deadline: formData.get('deadline') as string,
      description: formData.get('description') as string,
      progress: currentProgressRef.current // Utiliser la progression à jour
    };

    await updateProject(selectedProject.id, updates);
    setIsEditDialogOpen(false);
    toast({
      title: "Projet modifié",
      description: "Les informations du projet ont été mises à jour.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Projets</h1>
            <p className="text-white/50">Gérez vos projets en cours et terminés</p>
          </div>

          <Button
            onClick={handleCreateProject}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Projet
          </Button>
        </div>

        <div className="glass-morphism p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <Input
                  placeholder="Rechercher un projet ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all" className="text-white">Tous</SelectItem>
                  <SelectItem value="En cours" className="text-white">En cours</SelectItem>
                  <SelectItem value="Terminé" className="text-white">Terminé</SelectItem>
                  <SelectItem value="En pause" className="text-white">En pause</SelectItem>
                  <SelectItem value="Annulé" className="text-white">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/50">Nom du projet</TableHead>
                  <TableHead className="text-white/50 hidden sm:table-cell">Client</TableHead>
                  <TableHead className="text-white/50 hidden md:table-cell">Statut</TableHead>
                  <TableHead className="text-white/50 hidden md:table-cell">Priorité</TableHead>
                  <TableHead className="text-white/50 hidden lg:table-cell">Progrès</TableHead>
                  <TableHead className="text-white/50 hidden lg:table-cell">Budget</TableHead>
                  <TableHead className="text-white/50 hidden lg:table-cell">Encaissé</TableHead>
                  <TableHead className="text-white/50 hidden lg:table-cell">Temps</TableHead>
                  <TableHead className="text-white/50 hidden xl:table-cell">Échéance</TableHead>
                  <TableHead className="text-white/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="border-white/10 hover:bg-white/5 text-white">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm sm:text-base">{project.name}</div>
                        <div className="text-xs sm:text-sm text-white/40 sm:hidden">{project.clientName}</div>
                        <div className="text-xs text-white/40 truncate max-w-[200px]">{project.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{project.clientName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Select
                        value={project.status}
                        onValueChange={(value) => handleStatusChange(project, value)}
                      >
                        <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0">
                          <Badge className={`${statusColors[project.status]} text-white text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                            {project.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="En cours" className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              En cours
                            </div>
                          </SelectItem>
                          <SelectItem value="Terminé" className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Terminé
                            </div>
                          </SelectItem>
                          <SelectItem value="En pause" className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              En pause
                            </div>
                          </SelectItem>
                          <SelectItem value="Annulé" className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Annulé
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`${priorityColors[project.priority]} text-white text-xs`}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <div className="font-medium text-sm">{formatCurrency(project.budget)}</div>
                        <div className="text-xs text-white/40">
                          Dépensé: {formatCurrency(projectStats.get(project.id)?.spentAmount || 0)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="font-medium text-sm text-green-400">
                        {formatCurrency(projectStats.get(project.id)?.paidAmount || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        {formatTime(projectStats.get(project.id)?.timeTracked || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm">
                        {new Date(project.deadline).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/60 hover:text-white hover:bg-white/10 p-1"
                          onClick={() => handleEditProject(project)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-white/10 p-1"
                          onClick={() => handleEditProject(project)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-white/10 p-1"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <NewProjectModal
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent
            className="max-w-4xl glass-morphism border-white/20 max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Modifier le Projet</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div onClick={(e) => e.stopPropagation()}>
                {/* Bannière résumé Encaissé + Temps */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/50 uppercase tracking-wider">Encaissé</div>
                      <div className="text-lg font-bold text-green-400">
                        {formatCurrency(projectStats.get(selectedProject.id)?.paidAmount || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <div className="text-xs text-white/50 uppercase tracking-wider">Temps suivi</div>
                      <div className="text-lg font-bold text-white">
                        {formatTime(projectStats.get(selectedProject.id)?.timeTracked || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Nom du projet</Label>
                          <Input
                            name="name"
                            defaultValue={selectedProject.name}
                            className="bg-white/10 border-white/20 text-white"
                            required
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <Label className="text-white">Client</Label>
                          <Input
                            value={selectedProject.clientName}
                            className="bg-white/10 border-white/20 text-white"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Statut</Label>
                          <Select name="status" defaultValue={selectedProject.status}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="En cours" className="text-white">En cours</SelectItem>
                              <SelectItem value="Terminé" className="text-white">Terminé</SelectItem>
                              <SelectItem value="En pause" className="text-white">En pause</SelectItem>
                              <SelectItem value="Annulé" className="text-white">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Priorité</Label>
                          <Select name="priority" defaultValue={selectedProject.priority}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="Haute" className="text-white">Haute</SelectItem>
                              <SelectItem value="Moyenne" className="text-white">Moyenne</SelectItem>
                              <SelectItem value="Basse" className="text-white">Basse</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Budget total</Label>
                          <Input
                            name="budget"
                            type="number"
                            defaultValue={selectedProject.budget}
                            className="bg-white/10 border-white/20 text-white"
                            required
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <Label className="text-white">Montant dépensé</Label>
                          <Input
                            name="spent"
                            type="number"
                            defaultValue={selectedProject.spent}
                            className="bg-white/10 border-white/20 text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Date d'échéance</Label>
                        <Input
                          name="deadline"
                          type="date"
                          defaultValue={selectedProject.deadline}
                          className="bg-white/10 border-white/20 text-white"
                          required
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea
                          name="description"
                          defaultValue={selectedProject.description}
                          className="bg-white/10 border-white/20 text-white"
                          rows={3}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-xl">
                      <ProjectSteps
                        projectId={selectedProject.id}
                        onProgressChange={(progress) => handleProgressChange(selectedProject.id, progress)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditDialogOpen(false);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-white text-black hover:bg-white/90"
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white/80 mb-2">{projects.filter(p => p.status === 'En cours').length}</div>
            <div className="text-white/50 text-sm sm:text-base">En cours</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{projects.filter(p => p.status === 'Terminé').length}</div>
            <div className="text-white/50 text-sm sm:text-base">Terminés</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              {formatCurrency(projects.reduce((sum, p) => sum + p.budget, 0))}
            </div>
            <div className="text-white/50 text-sm sm:text-base">Budget total</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400 mb-2">
              {formatCurrency(totalPaidAmount)}
            </div>
            <div className="text-white/50 text-sm sm:text-base">CA encaissé</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center col-span-2 lg:col-span-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-white/50" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white/80">
                {formatTime(totalTimeTracked)}
              </span>
            </div>
            <div className="text-white/50 text-sm sm:text-base">Temps total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projets;
