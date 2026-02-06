import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Download, Copy, Key, Users, Calendar } from 'lucide-react';
import { LicenseGenerator, LicenseInfo } from '../utils/licenseGenerator';
import { toast } from '../components/ui/use-toast';

const LicenseAdmin = () => {
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [licenseCount, setLicenseCount] = useState(1);
  const [durationMonths, setDurationMonths] = useState(1);
  const [clientName, setClientName] = useState('');
  const [generatedLicenses, setGeneratedLicenses] = useState<LicenseInfo[]>([]);

  const plans = LicenseGenerator.getAllPlans();

  const handleGenerateLicenses = () => {
    if (licenseCount < 1 || licenseCount > 100) {
      toast({
        title: "Erreur",
        description: "Le nombre de licences doit être entre 1 et 100",
        variant: "destructive"
      });
      return;
    }

    const newLicenses = LicenseGenerator.generateBulkLicenses(
      selectedPlan, 
      licenseCount, 
      durationMonths
    );

    // Ajouter le nom du client si fourni
    if (clientName.trim()) {
      newLicenses.forEach(license => {
        license.clientName = clientName.trim();
      });
    }

    setGeneratedLicenses(prev => [...newLicenses, ...prev]);
    
    toast({
      title: "Licences générées",
      description: `${licenseCount} licence(s) ${selectedPlan} générée(s) avec succès`,
      variant: "default"
    });

    // Reset form
    setLicenseCount(1);
    setClientName('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Clé copiée dans le presse-papiers",
      variant: "default"
    });
  };

  const exportLicenses = () => {
    if (generatedLicenses.length === 0) {
      toast({
        title: "Aucune licence",
        description: "Aucune licence à exporter",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      'Clé,Plan,Client,Expiration,Projets Max,Utilisateurs Max,Généré le',
      ...generatedLicenses.map(license => [
        license.key,
        license.plan,
        license.clientName || '',
        new Date(license.expiryDate).toLocaleDateString('fr-FR'),
        license.maxProjects === -1 ? 'Illimité' : license.maxProjects,
        license.maxUsers,
        new Date(license.generatedAt).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licences_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: "Fichier CSV téléchargé avec succès",
      variant: "default"
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-500';
      case 'PRO': return 'bg-purple-500';
      case 'ENTERPRISE': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Administration des Licences</h1>
          <p className="text-purple-200">Générateur et gestionnaire de licences FreeLance Manager</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Générateur de licences */}
          <div className="lg:col-span-1">
            <Card className="glass-morphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Générer des Licences
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Créez de nouvelles clés de licence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Plan</Label>
                  <Select value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {Object.entries(plans).map(([planName, planInfo]) => (
                        <SelectItem key={planName} value={planName} className="text-white">
                          {planName} - {new Intl.NumberFormat('fr-FR').format(planInfo.price)} XOF/mois
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Nombre de licences</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={licenseCount}
                    onChange={(e) => setLicenseCount(parseInt(e.target.value) || 1)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Durée (mois)</Label>
                  <Select value={durationMonths.toString()} onValueChange={(value) => setDurationMonths(parseInt(value))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="1" className="text-white">1 mois</SelectItem>
                      <SelectItem value="3" className="text-white">3 mois</SelectItem>
                      <SelectItem value="6" className="text-white">6 mois</SelectItem>
                      <SelectItem value="12" className="text-white">12 mois</SelectItem>
                      <SelectItem value="24" className="text-white">24 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Nom du client (optionnel)</Label>
                  <Input
                    type="text"
                    placeholder="Nom de l'entreprise ou du client"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-purple-300"
                  />
                </div>

                <Button 
                  onClick={handleGenerateLicenses}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Générer {licenseCount} licence{licenseCount > 1 ? 's' : ''}
                </Button>

                {/* Informations du plan sélectionné */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-white font-semibold mb-2">Plan {selectedPlan}</h3>
                  <div className="space-y-1 text-sm text-purple-200">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {plans[selectedPlan].maxUsers} utilisateur{plans[selectedPlan].maxUsers > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <Key className="w-4 h-4 mr-2" />
                      {plans[selectedPlan].maxProjects === -1 ? 'Projets illimités' : `${plans[selectedPlan].maxProjects} projets`}
                    </div>
                    <div className="mt-2">
                      <div className="text-white font-semibold">
                        Prix: {new Intl.NumberFormat('fr-FR').format(plans[selectedPlan].price)} XOF/mois
                      </div>
                      <div className="text-purple-300">
                        Total: {new Intl.NumberFormat('fr-FR').format(plans[selectedPlan].price * durationMonths * licenseCount)} XOF
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des licences générées */}
          <div className="lg:col-span-2">
            <Card className="glass-morphism border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Licences Générées</CardTitle>
                    <CardDescription className="text-purple-200">
                      {generatedLicenses.length} licence{generatedLicenses.length > 1 ? 's' : ''} générée{generatedLicenses.length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  {generatedLicenses.length > 0 && (
                    <Button 
                      onClick={exportLicenses}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedLicenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <p className="text-purple-200">Aucune licence générée pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-purple-200">Clé</TableHead>
                          <TableHead className="text-purple-200">Plan</TableHead>
                          <TableHead className="text-purple-200 hidden sm:table-cell">Client</TableHead>
                          <TableHead className="text-purple-200 hidden md:table-cell">Expiration</TableHead>
                          <TableHead className="text-purple-200">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedLicenses.map((license, index) => (
                          <TableRow key={index} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white font-mono text-sm">
                              <div className="max-w-[200px] truncate">
                                {license.key}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getPlanColor(license.plan)} text-white`}>
                                {license.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white hidden sm:table-cell">
                              {license.clientName || 'Non spécifié'}
                            </TableCell>
                            <TableCell className="text-white hidden md:table-cell">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                {formatDate(license.expiryDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(license.key)}
                                className="text-blue-400 hover:bg-white/10"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseAdmin;