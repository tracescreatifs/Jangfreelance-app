import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Download, FileSpreadsheet, FileText, Calendar, CheckCircle, Loader2, Users, FolderOpen, Receipt, Calculator } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import { useTransactions } from '../hooks/useTransactions';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { useToast } from '../hooks/use-toast';
import {
  exportClientsToExcel,
  exportProjectsToExcel,
  exportInvoicesToExcel,
  exportTransactionsToExcel,
  exportFullReportToExcel,
  exportFinancialReportToPDF
} from '../services/exportService';

interface ExportTask {
  id: string;
  type: string;
  format: string;
  status: 'En cours' | 'Terminé' | 'Erreur';
  progress: number;
  createdAt: string;
}

const Exports = () => {
  const { toast } = useToast();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { invoices } = useInvoices();
  const { transactions } = useTransactions();
  const { profile: professionalProfile } = useProfessionalProfile();

  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [selectedExportType, setSelectedExportType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const exportTypes = [
    {
      id: 'clients',
      name: 'Liste des Clients',
      description: `${clients.length} clients enregistrés`,
      icon: Users,
      formats: ['Excel', 'CSV'],
      color: 'text-blue-400'
    },
    {
      id: 'projects',
      name: 'Projets',
      description: `${projects.length} projets au total`,
      icon: FolderOpen,
      formats: ['Excel', 'CSV'],
      color: 'text-green-400'
    },
    {
      id: 'invoices',
      name: 'Factures et Devis',
      description: `${invoices.length} documents`,
      icon: Receipt,
      formats: ['Excel', 'CSV'],
      color: 'text-purple-400'
    },
    {
      id: 'transactions',
      name: 'Transactions',
      description: `${transactions.length} transactions`,
      icon: Calculator,
      formats: ['Excel', 'CSV'],
      color: 'text-orange-400'
    },
    {
      id: 'financial-report',
      name: 'Rapport Financier',
      description: 'Résumé complet des finances',
      icon: FileText,
      formats: ['PDF', 'Excel'],
      color: 'text-red-400'
    },
    {
      id: 'full-report',
      name: 'Rapport Complet',
      description: 'Toutes les données en un fichier',
      icon: FileSpreadsheet,
      formats: ['Excel'],
      color: 'text-amber-400'
    }
  ];

  const periods = [
    { value: 'current-month', label: 'Mois en cours' },
    { value: 'last-month', label: 'Mois dernier' },
    { value: 'current-quarter', label: 'Trimestre en cours' },
    { value: 'current-year', label: 'Année en cours' },
    { value: 'all-time', label: 'Toutes les données' }
  ];

  const getPeriodLabel = (value: string) => {
    return periods.find(p => p.value === value)?.label || value;
  };

  const handleExport = async () => {
    if (!selectedExportType || !selectedFormat) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type d'export et un format",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    const newTask: ExportTask = {
      id: Date.now().toString(),
      type: exportTypes.find(t => t.id === selectedExportType)?.name || '',
      format: selectedFormat,
      status: 'En cours',
      progress: 0,
      createdAt: new Date().toLocaleString('fr-FR')
    };

    setExportTasks(prev => [newTask, ...prev]);

    // Simuler une progression
    const updateProgress = (progress: number) => {
      setExportTasks(prev =>
        prev.map(task =>
          task.id === newTask.id ? { ...task, progress } : task
        )
      );
    };

    try {
      updateProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress(50);

      // Exécuter l'export réel
      switch (selectedExportType) {
        case 'clients':
          exportClientsToExcel(clients);
          break;
        case 'projects':
          exportProjectsToExcel(projects);
          break;
        case 'invoices':
          exportInvoicesToExcel(invoices);
          break;
        case 'transactions':
          exportTransactionsToExcel(transactions);
          break;
        case 'financial-report':
          if (selectedFormat === 'PDF') {
            exportFinancialReportToPDF(
              transactions,
              invoices,
              getPeriodLabel(selectedPeriod),
              professionalProfile
            );
          } else {
            exportFullReportToExcel(clients, projects, invoices, transactions);
          }
          break;
        case 'full-report':
          exportFullReportToExcel(clients, projects, invoices, transactions);
          break;
      }

      updateProgress(100);

      // Marquer comme terminé
      setExportTasks(prev =>
        prev.map(task =>
          task.id === newTask.id ? { ...task, status: 'Terminé', progress: 100 } : task
        )
      );

      toast({
        title: "Export réussi",
        description: "Le fichier a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setExportTasks(prev =>
        prev.map(task =>
          task.id === newTask.id ? { ...task, status: 'Erreur', progress: 0 } : task
        )
      );
      toast({
        title: "Erreur",
        description: "L'export a échoué. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setSelectedExportType('');
      setSelectedFormat('');
    }
  };

  const statusColors = {
    'En cours': 'text-yellow-400',
    'Terminé': 'text-green-400',
    'Erreur': 'text-red-400'
  };

  const selectedTypeInfo = exportTypes.find(t => t.id === selectedExportType);

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Exports</h1>
            <p className="text-purple-200">Exportez vos données en PDF ou Excel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Configuration d'export */}
          <div className="lg:col-span-2">
            <div className="glass-morphism p-6 rounded-2xl mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Nouvel Export</h2>

              <div className="space-y-6">
                {/* Types d'export */}
                <div>
                  <Label className="text-white mb-3 block">Que souhaitez-vous exporter ?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exportTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => {
                          setSelectedExportType(type.id);
                          setSelectedFormat('');
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedExportType === type.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <type.icon className={`w-6 h-6 ${type.color} mt-1`} />
                          <div>
                            <div className="text-white font-medium">{type.name}</div>
                            <div className="text-purple-300 text-sm mt-1">{type.description}</div>
                            <div className="flex space-x-2 mt-2">
                              {type.formats.map(format => (
                                <span key={format} className="text-xs bg-white/10 px-2 py-1 rounded text-white">
                                  {format}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format et Période */}
                {selectedExportType && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Format</Label>
                      <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choisir le format" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          {selectedTypeInfo?.formats.map(format => (
                            <SelectItem key={format} value={format} className="text-white">
                              {format === 'Excel' ? 'Excel (.xlsx)' : format === 'PDF' ? 'PDF' : 'CSV'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(selectedExportType === 'financial-report' || selectedExportType === 'transactions') && (
                      <div>
                        <Label className="text-white mb-2 block">Période</Label>
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Sélectionner la période" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {periods.map(period => (
                              <SelectItem key={period.value} value={period.value} className="text-white">
                                {period.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton d'export */}
                <Button
                  onClick={handleExport}
                  disabled={!selectedExportType || !selectedFormat || isExporting}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform py-6 text-lg"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Télécharger
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            <Card className="glass-morphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Données disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Clients</span>
                    <span className="text-white font-bold">{clients.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Projets</span>
                    <span className="text-white font-bold">{projects.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Factures/Devis</span>
                    <span className="text-white font-bold">{invoices.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Transactions</span>
                    <span className="text-white font-bold">{transactions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-morphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Exports rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => exportClientsToExcel(clients)}
                    disabled={clients.length === 0}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Clients (Excel)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => exportInvoicesToExcel(invoices)}
                    disabled={invoices.length === 0}
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Factures (Excel)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => exportFullReportToExcel(clients, projects, invoices, transactions)}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Rapport complet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historique des exports */}
        {exportTasks.length > 0 && (
          <div className="glass-morphism p-6 rounded-2xl mt-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Historique des Exports</h3>

            <div className="space-y-4">
              {exportTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="text-white font-medium">{task.type}</div>
                        <div className="text-purple-300 text-sm">
                          {task.format} • {task.createdAt}
                        </div>
                      </div>
                    </div>

                    {task.status === 'En cours' && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-purple-200">Progression</span>
                          <span className="text-sm text-white">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <div className={`font-medium ${statusColors[task.status]}`}>
                      {task.status === 'En cours' && <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />}
                      {task.status === 'Terminé' && <CheckCircle className="w-4 h-4 inline-block mr-2" />}
                      {task.status}
                    </div>
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

export default Exports;
