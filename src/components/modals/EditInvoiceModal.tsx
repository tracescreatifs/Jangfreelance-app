
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
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
    
    setFormData({ ...formData, items: updatedItems });
    
    // Recalculer les totaux
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    
    setFormData(prev => prev ? { ...prev, subtotal, taxAmount, total, items: updatedItems } : null);
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

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Modifier {formData.type === 'devis' ? 'le devis' : 'la facture'} {formData.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input
                value={formData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Client *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="Envoyé">Envoyé</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
            <div>
              <Label>Taux de taxe (%)</Label>
              <Input
                type="number"
                value={formData.taxRate}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const taxAmount = (formData.subtotal * rate) / 100;
                  const total = formData.subtotal + taxAmount;
                  setFormData({ ...formData, taxRate: rate, taxAmount, total });
                }}
              />
            </div>
          </div>

          {/* Articles */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-semibold">Articles</Label>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-6 gap-4 items-end p-4 border rounded-lg">
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input
                      value={item.total.toLocaleString()}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span className="font-semibold">{formData.subtotal.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Taxe ({formData.taxRate}%):</span>
                <span className="font-semibold">{formData.taxAmount.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formData.total.toLocaleString()} CFA</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceModal;
