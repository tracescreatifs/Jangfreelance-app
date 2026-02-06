import React, { useState } from 'react';
import { Plus, Calendar, DollarSign, TrendingUp, TrendingDown, Grid, List, Filter, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useTransactions, Transaction } from '../hooks/useTransactions';
import { useToast } from '../hooks/use-toast';

const Comptabilite = () => {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const handleDeleteTransaction = async (transaction: Transaction) => {
    await deleteTransaction(transaction.id);
    toast({ title: 'Supprimé', description: 'Transaction supprimée' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalRecettes = transactions
    .filter(t => t.type === 'recette')
    .reduce((sum, t) => sum + t.montant, 0);

  const totalDepenses = transactions
    .filter(t => t.type === 'depense')
    .reduce((sum, t) => sum + t.montant, 0);

  const benefice = totalRecettes - totalDepenses;

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Comptabilité</h1>
            <p className="text-purple-200">Gestion de vos finances</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sélecteur de vue */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white'
                    : 'text-purple-200 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle Transaction
                </Button>
              </DialogTrigger>

              <DialogContent className="glass-morphism border-white/20 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Ajouter une transaction</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Date</Label>
                      <Input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Type</Label>
                      <Select value={newTransaction.type} onValueChange={(value: 'recette' | 'depense') => setNewTransaction({...newTransaction, type: value})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="recette" className="text-white hover:bg-gray-700">Recette</SelectItem>
                          <SelectItem value="depense" className="text-white hover:bg-gray-700">Dépense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Description de la transaction"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Catégorie</Label>
                    <Select value={newTransaction.categorie} onValueChange={(value) => setNewTransaction({...newTransaction, categorie: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newTransaction.categorie === 'Autres' && (
                    <div>
                      <Label className="text-white">Préciser la catégorie</Label>
                      <Input
                        value={newTransaction.autreCategorie}
                        onChange={(e) => setNewTransaction({...newTransaction, autreCategorie: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Précisez votre catégorie"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Montant (CFA)</Label>
                      <Input
                        type="number"
                        value={newTransaction.montant}
                        onChange={(e) => setNewTransaction({...newTransaction, montant: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-white">N° Facture (optionnel)</Label>
                      <Input
                        value={newTransaction.facture}
                        onChange={(e) => setNewTransaction({...newTransaction, facture: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="F2025-001"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddTransaction}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-500 to-blue-500"
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
                <p className="text-purple-200">Total Recettes</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRecettes)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200">Total Dépenses</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDepenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200">Bénéfice Net</p>
                <p className={`text-2xl font-bold ${benefice >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(benefice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass-morphism p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Transactions Récentes</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucune transaction</h3>
              <p className="text-purple-200">Commencez par ajouter votre première transaction</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === 'recette'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-200 text-sm">{new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-red-400 p-1 h-auto">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              Supprimer cette transaction ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTransaction(transaction)} className="bg-red-500 hover:bg-red-600">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <h3 className="text-white font-medium mb-2">{transaction.description}</h3>
                  <p className="text-purple-200 text-sm mb-3">{transaction.categorie}</p>

                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${
                      transaction.type === 'recette' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'recette' ? '+' : '-'}{formatCurrency(transaction.montant)}
                    </span>
                    {transaction.facture && (
                      <span className="text-purple-300 text-sm">{transaction.facture}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'recette'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{transaction.description}</h3>
                        <p className="text-purple-200 text-sm">{transaction.categorie}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`font-bold ${
                          transaction.type === 'recette' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'recette' ? '+' : '-'}{formatCurrency(transaction.montant)}
                        </span>
                        <p className="text-purple-200 text-sm">{new Date(transaction.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-white/60 hover:text-red-400 p-1 h-auto">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              Supprimer cette transaction ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTransaction(transaction)} className="bg-red-500 hover:bg-red-600">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
