import React, { useState, useMemo } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Grid, List, Trash2, FileText, Search, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useTransactions, Transaction } from '../hooks/useTransactions';
import { useInvoices } from '../hooks/useInvoices';
import { useToast } from '../hooks/use-toast';

// Type unifié pour affichage mixte (transactions manuelles + factures payées)
interface DisplayEntry {
  id: string;
  date: string;
  description: string;
  categorie: string;
  type: 'recette' | 'depense';
  montant: number;
  facture?: string;
  source: 'transaction' | 'invoice';
}

const Comptabilite = () => {
  const { transactions, loading: loadingTx, addTransaction, deleteTransaction } = useTransactions();
  const { invoices, loading: loadingInv } = useInvoices();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'recette' | 'depense'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'transaction' | 'invoice'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newTransaction, setNewTransaction] = useState({
    date: '',
    description: '',
    categorie: '',
    autreCategorie: '',
    type: 'recette' as 'recette' | 'depense',
    montant: '',
    facture: ''
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Design graphique',
    'Développement web',
    'Consultation',
    'Formation',
    'Marketing',
    'Logiciels',
    'Équipement',
    'Transport',
    'Communication',
    'Autres'
  ];

  // ── Fusionner transactions manuelles + factures payées ──

  const paidInvoiceEntries: DisplayEntry[] = useMemo(() => {
    return invoices
      .filter(inv => inv.type === 'facture' && inv.status === 'Payé')
      .map(inv => ({
        id: `inv-${inv.id}`,
        date: inv.createdAt?.split('T')[0] || inv.dueDate || '',
        description: `${inv.title} — ${inv.clientName}`,
        categorie: 'Facture payée',
        type: 'recette' as const,
        montant: inv.total,
        facture: inv.number,
        source: 'invoice' as const,
      }));
  }, [invoices]);

  const transactionEntries: DisplayEntry[] = useMemo(() => {
    return transactions.map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      categorie: t.categorie,
      type: t.type,
      montant: t.montant,
      facture: t.facture,
      source: 'transaction' as const,
    }));
  }, [transactions]);

  // Toutes les entrées triées par date décroissante
  const allEntries = useMemo(() => {
    return [...transactionEntries, ...paidInvoiceEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionEntries, paidInvoiceEntries]);

  // Entrées filtrées
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (filterType !== 'all' && entry.type !== filterType) return false;
      if (filterSource !== 'all' && entry.source !== filterSource) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          entry.description.toLowerCase().includes(term) ||
          entry.categorie.toLowerCase().includes(term) ||
          (entry.facture && entry.facture.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [allEntries, filterType, filterSource, searchTerm]);

  const activeFilters = filterType !== 'all' || filterSource !== 'all' || searchTerm !== '';

  // ── Calculs financiers (transactions manuelles + factures payées) ──

  const totalRecettes = useMemo(() => {
    const txRecettes = transactions
      .filter(t => t.type === 'recette')
      .reduce((sum, t) => sum + t.montant, 0);

    const invRecettes = paidInvoiceEntries
      .reduce((sum, e) => sum + e.montant, 0);

    return txRecettes + invRecettes;
  }, [transactions, paidInvoiceEntries]);

  const totalDepenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'depense')
      .reduce((sum, t) => sum + t.montant, 0);
  }, [transactions]);

  const benefice = totalRecettes - totalDepenses;

  const loading = loadingTx || loadingInv;

  // ── Handlers ──

  const handleAddTransaction = async () => {
    if (!newTransaction.date || !newTransaction.description || !newTransaction.montant) {
      toast({ title: 'Erreur', description: 'Veuillez remplir les champs obligatoires', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        date: newTransaction.date,
        description: newTransaction.description,
        categorie: newTransaction.categorie === 'Autres' ? newTransaction.autreCategorie : newTransaction.categorie,
        type: newTransaction.type,
        montant: parseFloat(newTransaction.montant),
        facture: newTransaction.facture || undefined
      });

      toast({ title: 'Succès', description: 'Transaction ajoutée' });

      setNewTransaction({
        date: '',
        description: '',
        categorie: '',
        autreCategorie: '',
        type: 'recette',
        montant: '',
        facture: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur ajout transaction:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter la transaction', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (entry: DisplayEntry) => {
    if (entry.source === 'invoice') {
      toast({
        title: 'Info',
        description: 'Les factures payées ne peuvent pas être supprimées ici. Modifiez le statut dans le menu Factures.',
      });
      return;
    }
    await deleteTransaction(entry.id);
    toast({ title: 'Supprimé', description: 'Transaction supprimée' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Comptabilité</h1>
            <p className="text-white/50">Gestion de vos finances</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sélecteur de vue */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-white/90 font-semibold">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle Transaction
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Ajouter une transaction</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Date</Label>
                      <Input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Type</Label>
                      <Select value={newTransaction.type} onValueChange={(value: 'recette' | 'depense') => setNewTransaction({...newTransaction, type: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10">
                          <SelectItem value="recette" className="text-white">Recette</SelectItem>
                          <SelectItem value="depense" className="text-white">Dépense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      placeholder="Description de la transaction"
                    />
                  </div>

                  <div>
                    <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Catégorie</Label>
                    <Select value={newTransaction.categorie} onValueChange={(value) => setNewTransaction({...newTransaction, categorie: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newTransaction.categorie === 'Autres' && (
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Préciser la catégorie</Label>
                      <Input
                        value={newTransaction.autreCategorie}
                        onChange={(e) => setNewTransaction({...newTransaction, autreCategorie: e.target.value})}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        placeholder="Précisez votre catégorie"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Montant (CFA)</Label>
                      <Input
                        type="number"
                        value={newTransaction.montant}
                        onChange={(e) => setNewTransaction({...newTransaction, montant: e.target.value})}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Facture liée (optionnel)</Label>
                      <Select
                        value={newTransaction.facture || 'none'}
                        onValueChange={(value) =>
                          setNewTransaction({...newTransaction, facture: value === 'none' ? '' : value})
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Aucune facture" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 max-h-60">
                          <SelectItem value="none" className="text-white">Aucune facture</SelectItem>
                          {invoices.map((inv) => (
                            <SelectItem key={inv.id} value={inv.number} className="text-white">
                              {inv.number} — {inv.title} — {inv.clientName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddTransaction}
                      disabled={isSubmitting}
                      className="bg-white text-black hover:bg-white/90 font-semibold"
                    >
                      {isSubmitting ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Total Recettes</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRecettes)}</p>
                <p className="text-white/30 text-xs mt-1">
                  Transactions + Factures payées
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Total Dépenses</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDepenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Bénéfice Net</p>
                <p className={`text-2xl font-bold ${benefice >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(benefice)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${benefice >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>

        {/* Transactions + Factures payées */}
        <div className="glass-morphism p-6 rounded-2xl">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Mouvements Financiers</h2>
              <span className="text-white/40 text-sm">
                {activeFilters ? `${filteredEntries.length} / ${allEntries.length}` : allEntries.length} entrées
              </span>
            </div>

            {/* Barre de filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
                />
              </div>

              {/* Filtre Type */}
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-full sm:w-36 bg-white/5 border-white/10 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="all" className="text-white">Tous types</SelectItem>
                  <SelectItem value="recette" className="text-green-400">Recettes</SelectItem>
                  <SelectItem value="depense" className="text-red-400">Dépenses</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Source */}
              <Select value={filterSource} onValueChange={(v: any) => setFilterSource(v)}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="all" className="text-white">Toutes sources</SelectItem>
                  <SelectItem value="transaction" className="text-white">Transactions</SelectItem>
                  <SelectItem value="invoice" className="text-white">Factures</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset filtres */}
              {activeFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterType('all'); setFilterSource('all'); setSearchTerm(''); }}
                  className="text-white/50 hover:text-white hover:bg-white/10 h-9 px-3 text-sm"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/30 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {activeFilters ? 'Aucun résultat' : 'Aucun mouvement'}
              </h3>
              <p className="text-white/50">
                {activeFilters
                  ? 'Essayez de modifier vos filtres'
                  : 'Ajoutez une transaction ou payez une facture pour commencer'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        entry.type === 'recette'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {entry.type === 'recette' ? 'Recette' : 'Dépense'}
                      </div>
                      {entry.source === 'invoice' && (
                        <div className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/60 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Facture
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/40 text-sm">{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                      {entry.source === 'transaction' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-white/60 hover:text-red-400 p-1 h-auto">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#111] border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/50">
                                Supprimer cette transaction ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEntry(entry)} className="bg-red-500 hover:bg-red-600 text-white">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  <h3 className="text-white font-medium mb-2 text-sm">{entry.description}</h3>
                  <p className="text-white/40 text-xs mb-3">{entry.categorie}</p>

                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${
                      entry.type === 'recette' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {entry.type === 'recette' ? '+' : '-'}{formatCurrency(entry.montant)}
                    </span>
                    {entry.facture && (
                      <span className="text-white/30 text-xs">{entry.facture}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        entry.type === 'recette'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {entry.type === 'recette' ? 'Recette' : 'Dépense'}
                      </div>
                      {entry.source === 'invoice' && (
                        <div className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          Facture
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-medium text-sm">{entry.description}</h3>
                        <p className="text-white/40 text-xs">{entry.categorie}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`font-bold ${
                          entry.type === 'recette' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {entry.type === 'recette' ? '+' : '-'}{formatCurrency(entry.montant)}
                        </span>
                        <p className="text-white/40 text-xs">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {entry.source === 'transaction' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-white/60 hover:text-red-400 p-1 h-auto">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#111] border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/50">
                                Supprimer cette transaction ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEntry(entry)} className="bg-red-500 hover:bg-red-600 text-white">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comptabilite;
