
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, Send, RefreshCw, FileText, Receipt } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import NewInvoiceModal from '../components/modals/NewInvoiceModal';
import EditInvoiceModal from '../components/modals/EditInvoiceModal';
import SendEmailModal from '../components/modals/SendEmailModal';
import InvoicePDF from '../components/InvoicePDF';
import { useInvoices } from '../hooks/useInvoices';
import { useToast } from '../hooks/use-toast';
import { Invoice } from '../hooks/useInvoices';

const Factures = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoices, updateInvoice, deleteInvoice, transformToInvoice, updateStatus } = useInvoices();
  
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusColors = {
    'Brouillon': 'bg-gray-500',
    'Envoyé': 'bg-blue-500',
    'Payé': 'bg-green-500',
    'En retard': 'bg-red-500',
    'Validé': 'bg-purple-500'
  };

  const typeColors = {
    'devis': 'bg-orange-500 text-white',
    'facture': 'bg-blue-500 text-white'
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSendEmail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsSendEmailModalOpen(true);
  };

  const handleEmailSent = async (invoiceId: string) => {
    await updateStatus(invoiceId, 'Envoyé');
    toast({
      title: "Email envoyé",
      description: "Le document a été envoyé avec succès"
    });
  };

  const handleTransformToInvoice = async (devis: Invoice) => {
    try {
      const newInvoice = await transformToInvoice(devis.id);
      if (newInvoice) {
        toast({
          title: "Devis transformé",
          description: `Le devis a été transformé en facture ${newInvoice.number}`
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de transformer ce devis en facture",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur transformation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de transformer ce devis en facture",
        variant: "destructive"
      });
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    await updateInvoice(updatedInvoice.id, updatedInvoice);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    await deleteInvoice(invoice.id);
    toast({
      title: "Document supprimé",
      description: `${invoice.type === 'devis' ? 'Le devis' : 'La facture'} ${invoice.number} a été supprimé`
    });
  };

  const canTransformToInvoice = (invoice: Invoice) => {
    return invoice.type === 'devis' && invoice.status === 'Validé';
  };

  const canEdit = (invoice: Invoice) => {
    return invoice.status === 'Brouillon';
  };

  const canDelete = (invoice: Invoice) => {
    return invoice.status === 'Brouillon';
  };

  const canSendEmail = (invoice: Invoice) => {
    return invoice.status === 'Brouillon' || invoice.status === 'Validé';
  };

  // Statistiques
  const stats = {
    totalDevis: invoices.filter(i => i.type === 'devis').length,
    totalFactures: invoices.filter(i => i.type === 'facture').length,
    totalMontant: invoices.reduce((sum, i) => sum + i.total, 0),
    enRetard: invoices.filter(i => i.status === 'En retard').length,
    enAttente: invoices.filter(i => i.status === 'Envoyé').length,
    payes: invoices.filter(i => i.status === 'Payé').length
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Factures & Devis</h1>
            <p className="text-purple-200">Gérez vos documents de facturation</p>
          </div>
          
          <Button 
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition-transform mt-4 sm:mt-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Document
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 sm:mb-8">
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-purple-300 mr-2" />
              <span className="text-2xl font-bold text-white">{stats.totalDevis}</span>
            </div>
            <div className="text-purple-200 text-sm">Devis</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="flex items-center justify-center mb-2">
              <Receipt className="w-5 h-5 text-purple-300 mr-2" />
              <span className="text-2xl font-bold text-white">{stats.totalFactures}</span>
            </div>
            <div className="text-purple-200 text-sm">Factures</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-lg font-bold text-green-400 mb-1">
              {formatCurrency(stats.totalMontant)}
            </div>
            <div className="text-purple-200 text-sm">CA Total</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.enAttente}</div>
            <div className="text-purple-200 text-sm">En attente</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{stats.payes}</div>
            <div className="text-purple-200 text-sm">Payés</div>
          </div>
          
          <div className="glass-morphism p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">{stats.enRetard}</div>
            <div className="text-purple-200 text-sm">En retard</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="glass-morphism p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <Input
                  placeholder="Rechercher par titre, client ou numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-200"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-white">Tous</SelectItem>
                <SelectItem value="devis" className="text-white">Devis</SelectItem>
                <SelectItem value="facture" className="text-white">Factures</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-white">Tous</SelectItem>
                <SelectItem value="Brouillon" className="text-white">Brouillon</SelectItem>
                <SelectItem value="Envoyé" className="text-white">Envoyé</SelectItem>
                <SelectItem value="Validé" className="text-white">Validé</SelectItem>
                <SelectItem value="Payé" className="text-white">Payé</SelectItem>
                <SelectItem value="En retard" className="text-white">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message si aucun document */}
        {filteredInvoices.length === 0 ? (
          <div className="glass-morphism p-8 rounded-2xl text-center">
            <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {invoices.length === 0 ? 'Aucun document créé' : 'Aucun résultat trouvé'}
            </h3>
            <p className="text-purple-200 mb-6">
              {invoices.length === 0 
                ? 'Commencez par créer votre premier devis ou facture'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            {invoices.length === 0 && (
              <Button 
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer un document
              </Button>
            )}
          </div>
        ) : (
          <div className="glass-morphism rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-purple-200 font-semibold">Numéro</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Type</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Titre</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Client</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Statut</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Montant</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Date</TableHead>
                  <TableHead className="text-purple-200 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-white/10 hover:bg-white/5 text-white">
                    <TableCell className="font-mono font-medium">{invoice.number}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[invoice.type]}>
                        {invoice.type === 'devis' ? 'Devis' : 'Facture'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{invoice.title}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[invoice.status]} text-white`}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-300">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white/80 hover:text-white p-2"
                          onClick={() => setSelectedInvoice(invoice)}
                          title="Aperçu"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {canEdit(invoice) && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white/80 hover:text-white p-2"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {canSendEmail(invoice) && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white/80 hover:text-white p-2"
                            onClick={() => handleSendEmail(invoice)}
                            title="Envoyer par email"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {canTransformToInvoice(invoice) && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white/80 hover:text-white p-2"
                            onClick={() => handleTransformToInvoice(invoice)}
                            title="Transformer en facture"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {canDelete(invoice) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-white/80 hover:text-white p-2"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Êtes-vous sûr de vouloir supprimer {invoice.type === 'devis' ? 'le devis' : 'la facture'} {invoice.number} ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal d'aperçu */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-morphism border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-semibold text-white">
                  Aperçu - {selectedInvoice.number}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                  size="sm"
                  className="border-white/20 text-white"
                >
                  Fermer
                </Button>
              </div>
              <div className="p-4">
                <InvoicePDF invoice={selectedInvoice} />
              </div>
            </div>
          </div>
        )}

        <NewInvoiceModal
          open={isNewInvoiceModalOpen}
          onOpenChange={setIsNewInvoiceModalOpen}
        />

        <EditInvoiceModal
          open={isEditInvoiceModalOpen}
          onOpenChange={setIsEditInvoiceModalOpen}
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
        />

        <SendEmailModal
          open={isSendEmailModalOpen}
          onOpenChange={setIsSendEmailModalOpen}
          invoice={selectedInvoice}
          onEmailSent={handleEmailSent}
        />
      </div>
    </div>
  );
};

export default Factures;
