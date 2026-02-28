import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Search, Building, User, Mail, Phone, MapPin, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { useClients, ClientLegacy } from '../hooks/useClients';
import NewClientModal from '../components/modals/NewClientModal';
import { useInvoices } from '../hooks/useInvoices';
import { useProjects } from '../hooks/useProjects';
import { toast } from '../components/ui/use-toast';

const Clients = () => {
  const navigate = useNavigate();
  const { clients, updateClient, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const { projects } = useProjects();
  const [selectedClient, setSelectedClient] = useState<ClientLegacy | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const statusColors = {
    'Actif': 'bg-green-500',
    'Inactif': 'bg-gray-500',
    'Prospect': 'bg-blue-500'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Extraire le nom du client depuis le format "Nom - Entreprise" des projets
  const extractName = (fullClientName: string) =>
    fullClientName.split(' - ')[0].toLowerCase().trim();

  // Calculer CA, nombre de projets et statut en temps réel
  const clientComputedData = useMemo(() => {
    const map = new Map<string, { totalRevenue: number; projectCount: number; status: 'Actif' | 'Inactif' | 'Prospect' }>();

    const paidInvoices = invoices.filter(inv => inv.type === 'facture' && inv.status === 'Payé');

    clients.forEach(client => {
      const clientNameLower = client.name.toLowerCase().trim();

      // CA = somme des factures payées de ce client
      const clientPaidInvoices = paidInvoices.filter(inv =>
        inv.clientName.toLowerCase().trim() === clientNameLower
      );
      const totalRevenue = clientPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

      // Nombre de projets de ce client
      const clientProjects = projects.filter(p =>
        extractName(p.clientName) === clientNameLower
      );
      const projectCount = clientProjects.length;

      // Statut auto : a des projets ou factures payées → Actif
      let status = client.status;
      if (totalRevenue > 0 || clientProjects.length > 0) {
        status = 'Actif';
      }

      map.set(client.id, { totalRevenue, projectCount, status });
    });

    return map;
  }, [clients, invoices, projects]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditClient = (client: ClientLegacy) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      await deleteClient(clientId);
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
        variant: "default"
      });
    }
  };

  const handleRelanceClient = (client: ClientLegacy) => {
    setSelectedClient(client);
    setIsEmailDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      notes: formData.get('notes') as string,
    };

    await updateClient(selectedClient.id, updates);
    setIsEditDialogOpen(false);
    toast({
      title: "Client modifié",
      description: "Les informations du client ont été mises à jour.",
      variant: "default"
    });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const emailData = {
      to: selectedClient?.email,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    console.log('Envoi email:', emailData);
    setIsEmailDialogOpen(false);
    toast({
      title: "Email envoyé",
      description: `Email de relance envoyé à ${selectedClient?.name}`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Clients</h1>
            <p className="text-purple-200">Gérez vos relations clients</p>
          </div>

          <Button
            onClick={handleCreateClient}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Client
          </Button>
        </div>

        {/* Recherche */}
        <div className="glass-morphism p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-200"
            />
          </div>
        </div>

        {/* Tableau des clients */}
        <div className="glass-morphism rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-purple-200">Client</TableHead>
                  <TableHead className="text-purple-200 hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="text-purple-200 hidden md:table-cell">Entreprise</TableHead>
                  <TableHead className="text-purple-200 hidden lg:table-cell">Type</TableHead>
                  <TableHead className="text-purple-200 hidden lg:table-cell">Projets</TableHead>
                  <TableHead className="text-purple-200 hidden xl:table-cell">CA Total</TableHead>
                  <TableHead className="text-purple-200">Statut</TableHead>
                  <TableHead className="text-purple-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-white/10 hover:bg-white/5 text-white">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-sm sm:text-base">{client.name}</div>
                          <div className="text-xs sm:text-sm text-purple-300">{client.city}</div>
                          <div className="sm:hidden text-xs text-purple-300">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-purple-300" />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-purple-300" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        {client.type === 'Entreprise' ?
                          <Building className="w-4 h-4 mr-2 text-purple-300" /> :
                          <User className="w-4 h-4 mr-2 text-purple-300" />
                        }
                        <span className="truncate max-w-[120px]">{client.company}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="border-white/20 text-white">
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-center">
                        <div className="text-lg font-bold">{clientComputedData.get(client.id)?.projectCount || 0}</div>
                        <div className="text-sm text-purple-300">projets</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="font-semibold">{formatCurrency(clientComputedData.get(client.id)?.totalRevenue || 0)}</div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const computedStatus = clientComputedData.get(client.id)?.status || client.status;
                        return (
                          <Badge className={`${statusColors[computedStatus]} text-white text-xs`}>
                            {computedStatus}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:bg-white/10 p-1"
                          onClick={() => handleRelanceClient(client)}
                          title="Relancer"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-white/10 p-1"
                          onClick={() => handleEditClient(client)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-white/10 p-1"
                          onClick={() => handleDeleteClient(client.id)}
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

        {/* Modal création */}
        <NewClientModal
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        {/* Dialog de modification */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl glass-morphism border-white/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Modifier le Client</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <form onSubmit={handleSaveEdit} className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Nom complet</Label>
                    <Input
                      name="name"
                      defaultValue={selectedClient.name}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      defaultValue={selectedClient.email}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Téléphone</Label>
                    <Input
                      name="phone"
                      defaultValue={selectedClient.phone}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Entreprise</Label>
                    <Input
                      name="company"
                      defaultValue={selectedClient.company}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Adresse</Label>
                    <Input
                      name="address"
                      defaultValue={selectedClient.address}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Ville</Label>
                    <Input
                      name="city"
                      defaultValue={selectedClient.city}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Notes</Label>
                  <Textarea
                    name="notes"
                    defaultValue={selectedClient.notes}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Sauvegarder
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de relance email */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="max-w-lg glass-morphism border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Relancer {selectedClient?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <Label className="text-white">Destinataire</Label>
                  <Input
                    value={selectedClient.email}
                    className="bg-white/10 border-white/20 text-white"
                    disabled
                  />
                </div>

                <div>
                  <Label className="text-white">Objet</Label>
                  <Input
                    name="subject"
                    defaultValue="Suivi de notre collaboration"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label className="text-white">Message</Label>
                  <Textarea
                    name="message"
                    defaultValue={`Bonjour ${selectedClient.name},

J'espère que vous allez bien. Je me permets de vous recontacter concernant votre projet.

N'hésitez pas à me faire savoir si vous avez des questions ou si nous pouvons avancer sur votre demande.

Cordialement,`}
                    className="bg-white/10 border-white/20 text-white"
                    rows={6}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmailDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{clients.filter(c => clientComputedData.get(c.id)?.status === 'Actif').length}</div>
            <div className="text-purple-200 text-sm sm:text-base">Clients actifs</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">{clients.filter(c => (clientComputedData.get(c.id)?.status || c.status) === 'Prospect').length}</div>
            <div className="text-purple-200 text-sm sm:text-base">Prospects</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center col-span-2 lg:col-span-1">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-400 mb-2">
              {formatCurrency(clients.reduce((sum, c) => sum + (clientComputedData.get(c.id)?.totalRevenue || 0), 0))}
            </div>
            <div className="text-purple-200 text-sm sm:text-base">CA Total</div>
          </div>

          <div className="glass-morphism p-4 sm:p-6 rounded-2xl text-center col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-2">
              {clients.reduce((sum, c) => sum + (clientComputedData.get(c.id)?.projectCount || 0), 0)}
            </div>
            <div className="text-purple-200 text-sm sm:text-base">Projets totaux</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
