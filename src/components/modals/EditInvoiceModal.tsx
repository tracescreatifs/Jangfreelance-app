
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Invoice } from '../../hooks/useInvoices';

interface EditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSave: (invoice: Invoice) => void;
}

const EditInvoiceModal = ({ open, onOpenChange, invoice, onSave }: EditInvoiceModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Invoice | null>(null);

  useEffect(() => {
    if (invoice) {
      setFormData({ ...invoice });
    }
  }, [invoice]);

  const handleInputChange = (field: keyof Invoice, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    if (!formData) return;
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculer le total de l'item
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    // Recalculer les totaux globaux
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;

    setFormData({ ...formData, items: updatedItems, subtotal, taxAmount, total });
  };

  const addItem = () => {
    if (!formData) return;
    const newItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (index: number) => {
    if (!formData) return;
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;

    setFormData({ ...formData, items: updatedItems, subtotal, taxAmount, total });
  };

  const handleSave = () => {
    if (!formData) return;

    if (!formData.title.trim() || !formData.clientName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    toast({
      title: "Succès",
      description: `${formData.type === 'devis' ? 'Devis' : 'Facture'} modifié avec succès`
    });
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' CFA';
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-[#111] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Modifier {formData.type === 'devis' ? 'le devis' : 'la facture'} {formData.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ---- Informations générales ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Sous-titre</Label>
              <Input
                value={formData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Client *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="Envoyé">Envoyé</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Date d'échéance</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Taux de taxe (%)</Label>
              <Input
                type="number"
                value={formData.taxRate}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const taxAmount = (formData.subtotal * rate) / 100;
                  const total = formData.subtotal + taxAmount;
                  setFormData({ ...formData, taxRate: rate, taxAmount, total });
                }}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
          </div>

          {/* ---- Articles ---- */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-semibold text-white">Articles</Label>
              <Button
                type="button"
                onClick={addItem}
                size="sm"
                className="bg-white text-black hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 items-end p-4 rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  {/* Description */}
                  <div className="col-span-12 sm:col-span-4">
                    <Label className="text-white/50 text-xs mb-1 block">Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      rows={2}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 resize-none"
                    />
                  </div>

                  {/* Quantité */}
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-white/50 text-xs mb-1 block">Qté</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="bg-white/5 border-white/10 text-white focus:border-white/30"
                    />
                  </div>

                  {/* Prix unitaire */}
                  <div className="col-span-4 sm:col-span-3">
                    <Label className="text-white/50 text-xs mb-1 block">Prix unitaire</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="bg-white/5 border-white/10 text-white focus:border-white/30"
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-3 sm:col-span-2">
                    <Label className="text-white/50 text-xs mb-1 block">Total</Label>
                    <div className="h-10 flex items-center justify-end px-3 rounded-md bg-white/10 border border-white/15 text-white font-semibold text-sm">
                      {formatCurrency(item.total)}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <div className="col-span-1 flex items-end justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 w-10 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-white/30 border border-dashed border-white/10 rounded-lg">
                  Aucun article — cliquez sur "Ajouter" pour commencer
                </div>
              )}
            </div>
          </div>

          {/* ---- Totaux ---- */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div className="space-y-3 max-w-xs ml-auto">
              <div className="flex justify-between text-sm text-white/60">
                <span>Sous-total HT</span>
                <span className="text-white font-medium">{formatCurrency(formData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Taxe ({formData.taxRate}%)</span>
                <span className="text-white font-medium">{formatCurrency(formData.taxAmount)}</span>
              </div>
              <div className="border-t border-white/15 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-white">TOTAL TTC</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(formData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Actions ---- */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-white text-black hover:bg-white/90 font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceModal;
