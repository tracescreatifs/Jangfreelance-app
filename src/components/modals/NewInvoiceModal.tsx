
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, FileText, Plus, Trash2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useClients } from '../../hooks/useClients';
import { useInvoices } from '../../hooks/useInvoices';
import { useProjects } from '../../hooks/useProjects';
import { useToast } from '../../hooks/use-toast';
import { serviceStore, Category } from '../../stores/serviceStore';

interface NewInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: () => void;
}

interface InvoiceItem {
  id: string;
  categoryId: string;
  subCategoryId: string;
  serviceId: string;
  description: string;
  quantity: number;
  price: number;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ open, onOpenChange, onInvoiceCreated }) => {
  const { clients } = useClients();
  const { addInvoice } = useInvoices();
  const { projects } = useProjects();
  const { toast } = useToast();
  const [categories] = useState<Category[]>(serviceStore.getCategories());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    client: '',
    project: '',
    date: new Date(),
    dueDate: undefined as Date | undefined,
    type: 'invoice' as 'invoice' | 'quote',
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { 
      id: '1', 
      categoryId: '',
      subCategoryId: '',
      serviceId: '',
      description: '', 
      quantity: 1, 
      price: 0 
    }
  ]);

  // Filtrer les projets du client sélectionné
  const selectedClient = clients.find(c => c.id === formData.client);
  const clientProjects = formData.client
    ? projects.filter(p => p.clientName === selectedClient?.name || p.clientId === formData.client)
    : projects;

  const getDocumentConfig = () => {
    return formData.type === 'invoice' 
      ? {
          title: 'Nouvelle Facture',
          buttonText: 'Créer la Facture',
          buttonClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
          description: 'Créez une nouvelle facture'
        }
      : {
          title: 'Nouveau Devis',
          buttonText: 'Créer le Devis',
          buttonClass: 'bg-gradient-to-r from-purple-500 to-purple-600',
          description: 'Créez un nouveau devis'
        };
  };

  const config = getDocumentConfig();

  const addItem = () => {
    setItems(prev => [...prev, { 
      id: Date.now().toString(), 
      categoryId: '',
      subCategoryId: '',
      serviceId: '',
      description: '', 
      quantity: 1, 
      price: 0 
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, key: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [key]: value };
        
        // Auto-fill when service is selected
        if (key === 'serviceId' && value) {
          const service = getServiceById(value);
          if (service) {
            updatedItem.description = service.name;
            updatedItem.price = service.price;
          }
        }
        
        // Reset subcategory when category changes
        if (key === 'categoryId') {
          updatedItem.subCategoryId = '';
          updatedItem.serviceId = '';
          updatedItem.description = '';
          updatedItem.price = 0;
        }
        
        // Reset service when subcategory changes
        if (key === 'subCategoryId') {
          updatedItem.serviceId = '';
          updatedItem.description = '';
          updatedItem.price = 0;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const getServiceById = (serviceId: string) => {
    for (const category of categories) {
      for (const subCategory of category.subCategories) {
        const service = subCategory.services.find(s => s.id === serviceId);
        if (service) return service;
      }
    }
    return null;
  };

  const getSubCategories = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.subCategories : [];
  };

  const getServices = (categoryId: string, subCategoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    const subCategory = category.subCategories.find(sc => sc.id === subCategoryId);
    return subCategory ? subCategory.services : [];
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un client', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const total = calculateTotal();
      const type = formData.type === 'invoice' ? 'facture' : 'devis';
      const clientName = selectedClient?.name || '';

      await addInvoice({
        number: '',
        type,
        title: formData.project || `${type === 'facture' ? 'Facture' : 'Devis'} - ${clientName}`,
        subtitle: '',
        clientName,
        status: 'Brouillon',
        subtotal: total,
        taxRate: 0,
        taxAmount: 0,
        total,
        fiscalRegime: '',
        dueDate: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : '',
        notes: formData.notes,
        items: items
          .filter(item => item.description.trim() !== '')
          .map(item => ({
            id: '',
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.quantity * item.price,
          })),
      });

      toast({
        title: 'Succès',
        description: `${type === 'facture' ? 'Facture' : 'Devis'} créé avec succès`,
      });

      onInvoiceCreated?.();
      onOpenChange(false);

      // Reset form
      setFormData({
        client: '',
        project: '',
        date: new Date(),
        dueDate: undefined,
        type: 'invoice',
        notes: ''
      });
      setItems([{
        id: '1',
        categoryId: '',
        subCategoryId: '',
        serviceId: '',
        description: '',
        quantity: 1,
        price: 0
      }]);
    } catch (error) {
      console.error('Erreur création facture:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le document', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto glass-morphism border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Client</Label>
              <Select value={formData.client} onValueChange={(value) => {
                handleInputChange('client', value);
                // Reset projet quand on change de client
                handleInputChange('project', '');
              }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id} className="text-white">
                      {client.name}{client.company ? ` - ${client.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Projet</Label>
              <Select value={formData.project} onValueChange={(value) => handleInputChange('project', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {clientProjects.length > 0 ? (
                    clientProjects.map(project => (
                      <SelectItem key={project.id} value={project.name} className="text-white">
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled className="text-gray-400">
                      Aucun projet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="quote" className="text-white">Devis</SelectItem>
                  <SelectItem value="invoice" className="text-white">Facture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-white">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleInputChange('date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="text-white">Échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => handleInputChange('dueDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Items avec services hiérarchiques */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white text-lg">Services</Label>
              <Button type="button" onClick={addItem} size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
            
            {items.map((item, index) => (
              <div key={item.id} className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-white text-sm">Catégorie</Label>
                    <Select 
                      value={item.categoryId} 
                      onValueChange={(value) => updateItem(item.id, 'categoryId', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id} className="text-white">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white text-sm">Sous-catégorie</Label>
                    <Select 
                      value={item.subCategoryId} 
                      onValueChange={(value) => updateItem(item.id, 'subCategoryId', value)}
                      disabled={!item.categoryId}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {getSubCategories(item.categoryId).map(subCategory => (
                          <SelectItem key={subCategory.id} value={subCategory.id} className="text-white">
                            {subCategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white text-sm">Service</Label>
                    <Select 
                      value={item.serviceId} 
                      onValueChange={(value) => updateItem(item.id, 'serviceId', value)}
                      disabled={!item.subCategoryId}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {getServices(item.categoryId, item.subCategoryId).map(service => (
                          <SelectItem key={service.id} value={service.id} className="text-white">
                            {service.name} - {service.price.toLocaleString()} CFA
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-white text-sm">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Description personnalisée..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-white text-sm">Quantité</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white"
                      min="1"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-white text-sm">Prix unitaire</Label>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white"
                      min="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-white text-sm">Total</Label>
                    <div className="text-white font-mono text-sm py-2">
                      {(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-right">
              <div className="text-white text-xl font-bold">
                Total: {calculateTotal().toLocaleString()} CFA
              </div>
            </div>
          </div>

          <div>
            <Label className="text-white">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/20 text-white">
              Annuler
            </Button>
            <Button
              type="submit"
              className={config.buttonClass}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : config.buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceModal;
